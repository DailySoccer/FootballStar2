#pragma strict

var AttackingPosition : GameObject; // GameObject que indica la posición de ataque. Deberíamos sustituirlo por 
var DefensivePosition : GameObject;
var Ball : GameObject;
var PhysicBall : GameObject;
var Team : GameObject;
var TeamOpponent : GameObject;
var ShootingPosition : GameObject;
var Mark : GameObject;
var Position : String;

@System.NonSerialized
var RunSpeed : float = 1;
@System.NonSerialized
var DribbleSpeed : float = 1;
@System.NonSerialized
var ReturnSpeed : float = 1;
@System.NonSerialized
var SprintSpeed : float = 1;
@System.NonSerialized
var ChaseBallSpeed : float = 1;
@System.NonSerialized
var WalkSpeed : float = 1;
@System.NonSerialized
var TackleDistance : float = 6;

@System.NonSerialized
var ClosestToBall : boolean = false; // Nos lo comunica Team, lo guardamos aquí para poder leerlo desde la FSM
@System.NonSerialized
var HomePosition : Vector3; // La accede la FSM para dirigirnos a ese punto
@System.NonSerialized
var TargetPosition : Vector3; // La puede escribir el equipo (o nosotros), necesaria para saber dónde ir en caso de que seamos los más cercanos o el lugar del campo en el que hay que colocarse en los turnos
@System.NonSerialized
var Interactive : boolean;

private var TackleSuccess : boolean; // Mal nombre, determina si hemos dado la orden de tackle a tiempo
private var Pitch : GameObject;
private var TheGameController : GameObject;

private var RunSpeed_Low : float = 4;
private var DribbleSpeed_Low : float = 3;
private var ReturnSpeed_Low : float = 3;
private var SprintSpeed_Low : float = 5;
private var ChaseBallSpeed_Low : float = 4;
private var WalkSpeed_Low : float = 2;

private var RunSpeed_Hi : float = 5;
private var DribbleSpeed_Hi : float = 4;
private var ReturnSpeed_Hi : float = 4;
private var SprintSpeed_Hi : float = 7;
private var ChaseBallSpeed_Hi : float = 6;
private var WalkSpeed_Hi : float = 2;

private var ProbTackle_DEF : float = 0.5;
private var ProbTackle_MID : float = 0.4;
private var ProbTackle_DEL : float = 0.3;

private var ProbDodge_DEF : float = 0;
private var ProbDodge_MID : float = 0.1;
private var ProbDodge_DEL : float = 0.2;

private var ProbTackle : float;
private var ProbDodge : float;

function Awake () {

	Pitch = GameObject.Find("Pitch");
	
	TheGameController = GameObject.Find("GameController");
		
	// Probabilidades en las entradas
	
	if ( Position == "DEF" ) {
		ProbTackle = ProbTackle_DEF;
		ProbDodge = ProbDodge_DEF;
	} else if ( Position == "MID" ) {
		ProbTackle = ProbTackle_MID;
		ProbDodge = ProbDodge_MID;
	} else {
		ProbTackle = ProbTackle_DEL;
		ProbDodge = ProbDodge_DEL;
	}

}

function InitStart () {

	if ( TheGameController.GetComponent(GameController).Dificulty == 0 ) {
		if ( Team.name == "TeamOpponent" ) {
			RunSpeed = RunSpeed_Low;
			DribbleSpeed = DribbleSpeed_Low;
			ReturnSpeed = ReturnSpeed_Low;
			SprintSpeed = SprintSpeed_Low;
			ChaseBallSpeed = ChaseBallSpeed_Low;
			WalkSpeed = WalkSpeed_Low;
		} else {
			RunSpeed = RunSpeed_Hi;
			DribbleSpeed = DribbleSpeed_Hi;
			ReturnSpeed = ReturnSpeed_Hi;
			SprintSpeed = SprintSpeed_Hi;
			ChaseBallSpeed = ChaseBallSpeed_Hi;
			WalkSpeed = WalkSpeed_Hi;		
		}
	} else {
		if ( Team.name == "TeamOpponent" ) {
			RunSpeed = RunSpeed_Hi;
			DribbleSpeed = DribbleSpeed_Hi;
			ReturnSpeed = ReturnSpeed_Hi;
			SprintSpeed = SprintSpeed_Hi;
			ChaseBallSpeed = ChaseBallSpeed_Hi;
			WalkSpeed = WalkSpeed_Hi;
		} else {
			RunSpeed = RunSpeed_Low;
			DribbleSpeed = DribbleSpeed_Low;
			ReturnSpeed = ReturnSpeed_Low;
			SprintSpeed = SprintSpeed_Low;
			ChaseBallSpeed = ChaseBallSpeed_Low;
			WalkSpeed = WalkSpeed_Low;		
		}
	}

}

function Start () {

}

function Update () {

}

function SetHomeDefensivePosition () {
	
	HomePosition.x = DefensivePosition.transform.position.x - Pitch.GetComponent(SoccerPitch).RegionLength/2 + Random.Range(0, Pitch.GetComponent(SoccerPitch).RegionLength);
	HomePosition.y = DefensivePosition.transform.position.y;
	HomePosition.z = DefensivePosition.transform.position.z - Pitch.GetComponent(SoccerPitch).RegionWidth/2 + Random.Range(0, Pitch.GetComponent(SoccerPitch).RegionWidth);
	
	GetDefensivePosition();
	
}

function SetHomeAttackingPosition () {

	HomePosition.x = AttackingPosition.transform.position.x - Pitch.GetComponent(SoccerPitch).RegionLength/2 + Random.Range(0, Pitch.GetComponent(SoccerPitch).RegionLength);
	HomePosition.y = AttackingPosition.transform.position.y;
	HomePosition.z = AttackingPosition.transform.position.z - Pitch.GetComponent(SoccerPitch).RegionWidth/2 + Random.Range(0, Pitch.GetComponent(SoccerPitch).RegionWidth);

}

function GetControl () {

	
	// Si la bola está siendo conducida por alguien que no soy yo, comunicamos el cambio de propietario
	// Tenemos que comprobar que no soy yo para no perder el control tras volver del Dodge
	
	if ( PhysicBall.GetComponent(SoccerBall).Owner != null && PhysicBall.GetComponent(SoccerBall).Owner != gameObject ) {
		PhysicBall.GetComponent(SoccerBall).Owner.GetComponent(PlayMakerFSM).Fsm.Event("Msg_LoseControl");
	}
	
	PhysicBall.GetComponent(SoccerBall).Owner = gameObject;

}

function LoseControl () {

	if ( PhysicBall.GetComponent(SoccerBall).Owner == gameObject )
		PhysicBall.GetComponent(SoccerBall).Owner = null;

}

function SetInteractive () {

	Interactive = true;
	gameObject.transform.FindChild("Marker").gameObject.active = true;

}

function SetAutomatic () {

	Interactive = false;
	gameObject.transform.FindChild("Marker").gameObject.active = false;

}

// 

function PassToTeamMate () {
	
	return Team.GetComponent(SoccerTeam).GetTeamMateToPass(gameObject);
	
}

function GetRandomTargetInGoal ( shootingPoint : GameObject ) {
	
	// Calculamos un punto al azar dentro de la portería y añadimos un poco de potencia para asegurarnos de que va dentro
	// GAMEPLAY TWEAK
	// En difícil, tira ajustado a los palos
	
	var tShootingPoint : Vector3;
	var tGoalWidth : float = Pitch.GetComponent(SoccerPitch).GoalWidth/2;
	
	if ( TheGameController.GetComponent(GameController).Dificulty > 0 ) {
		// Mayor probabilidad de que tire ajustado a los palos
		if ( Random.value < 0.8 ) {
			tShootingPoint = Vector3((-tGoalWidth/2) + (Mathf.Round(Random.value)*0.9*tGoalWidth), 0, 0);
		} else {
			tShootingPoint = Vector3((-tGoalWidth/4) + (Random.value*tGoalWidth/2), 0, 0);
		}
	} else {
		// Mayor probabilidad de que tire cerca
		if ( Random.value < 0.2 ) {
			tShootingPoint = Vector3((-tGoalWidth/2) + (Mathf.Round(Random.value)*0.9*tGoalWidth), 0, 0);
		} else {
			tShootingPoint = Vector3((-tGoalWidth/4) + (Random.value*tGoalWidth/2), 0, 0);
		}		
	}
	
	var goalPoint : Vector3 = shootingPoint.transform.position + Vector3(-3.6 + Random.value*7.2, 0, 0);
	var shootTarget : Vector3 = Ball.transform.position + (goalPoint - Ball.transform.position)*1.5;
	//ShootToTarget( shootTarget );
	return shootTarget;

}

function ShootToTarget (tTarget : Vector3) {

	gameObject.transform.LookAt(tTarget);
	PhysicBall.GetComponent(SoccerBall).ShootToTarget(tTarget);

}

function ShootSwipe ( tMouseSwipe : Vector3 ) {

	// tMouseSwipe es un vector normalizado de magnitud entre 0 y 1 
	var tiroMin : float = 15;
	var tiroMax : float = 20;
	var tiroMaxAng : float = 10;
	var minSwipeLength =  TheGameController.GetComponent(GameController).minSwipeLength;
	
	// Miramos al destino del tiro
	gameObject.transform.LookAt(gameObject.transform.position+tMouseSwipe);

	// Efectuamos el tiro
	var tIntensity = -( (Mathf.Pow(minSwipeLength,2)/Mathf.Pow(tMouseSwipe.magnitude,2)) - 1 );
	var tForce : float = tiroMin + ( tIntensity * ( tiroMax - tiroMin ) ); 
	var tVelocity : Vector3 = tMouseSwipe.normalized * tForce;
	tVelocity = Quaternion.AngleAxis( tIntensity*tiroMaxAng, Vector3.left) * tVelocity;
	PhysicBall.GetComponent(SoccerBall).DoShoot( tVelocity );
	

}

function SearchClosestTeamMate ( tPosition : Vector3 ) {
	
	var newDistance : float;
	var minorDistance : float = 2000; //Vector3.Distance(Team.GetComponent(SoccerTeam).PlayersList[1].transform.position,tPosition);
	var playerIndex : int = 1;
	
	for (var i : int = 1; i < Team.GetComponent(SoccerTeam).PlayersList.length; i++) {
		
		if (Team.GetComponent(SoccerTeam).PlayersList[i] != gameObject) {
		
			newDistance = Vector3.Distance(Team.GetComponent(SoccerTeam).PlayersList[i].transform.position,tPosition);
			if ( newDistance < minorDistance) {
				minorDistance = newDistance;
				playerIndex = i;
			}
		
		}
		
	}
	
	return Team.GetComponent(SoccerTeam).PlayersList[playerIndex];

}

// Controles de las entradas automáticas

function CheckSteal() {

	var tDistance : float = Vector3.Distance(gameObject.transform.position, Ball.transform.position);

	if ( tDistance < 0.8 ) {
	
		if ( PhysicBall.GetComponent(SoccerBall).Owner != null ) {
				
				// Recordad que puede ser llamado desde un jugador del propio equipo
				if ( PhysicBall.GetComponent(SoccerBall).Owner.GetComponent(PlayMakerFSM).ActiveStateName == "Dodge" ) {
					
					var probSteal : float = GetStealProbability();
					
					// Si mi propio estado es Wait, tiramos un dado para saber si quitamos la bola
					if ( gameObject.GetComponent(PlayMakerFSM).ActiveStateName == "WaitOpponent" ) {
						
						// GAMEPLAY TWEAK
						//Debug.Log("CheckSteal WaitOpponent: " + gameObject + ", " + probSteal);
						if ( Random.value <= probSteal ) {
							gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_StealFailed");
						} else {
							gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_GetControl");
						}
						
					} else {
					
						// GAMEPLAY TWEAK
 						if ( Random.value <= probSteal ) {
							gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_StealFailed");
						} else {
							gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_GetControl");
						}
						/*
						gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_StealFailed");
						*/
					}
					
				} else {
					
					// Si el que conduce no ha hecho dodge, hay robo
					gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_GetControl");
				
				}
		
		} else {
		
			gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_GetControl");
		
		}
		
	}

}

// Controles de las entradas 

function CheckChase( ) {

	var tDistance : float = Vector3.Distance(gameObject.transform.position, Ball.transform.position);
	
	if ( PhysicBall.GetComponent(SoccerBall).Owner != null && PhysicBall.GetComponent(SoccerBall).Owner.GetComponent(FieldPlayer).Team.name == "TeamOpponent" ) {
		
		if ( tDistance < 10 ) {
			SetInteractive();
			if ( tDistance < 0.8 ) {
			
				gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_LoseTackleOption");
				PhysicBall.GetComponent(SoccerBall).Owner.GetComponent(PlayMakerFSM).Fsm.Event("Msg_SolveThreat");
			
			} else if ( tDistance >= 0.8 && tDistance < 2 ) {
				
				// Demasiado tarde, si hacemos tackle, será fallido...
				TackleSuccess = false;
			
			} else {

				// Chapuza. Estamos en distancia de robo, simplemente lo ponemos a true para luego tirar el dado en el tackle
				TackleSuccess = true;
				
			}
			
		} else {
		
			TackleSuccess = false;
			SetAutomatic();
		
		}
	
	} else if ( PhysicBall.GetComponent(SoccerBall).Owner == null ) {
	
		if ( tDistance < 0.8 ) {
		
			gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_GetControl");
		
		}
	
	}

}

function CheckTackle () {

	var tDistance : float = Vector3.Distance(gameObject.transform.position, Ball.transform.position);
	
	if ( PhysicBall.GetComponent(SoccerBall).Owner != null ) {
		
		if ( tDistance < 0.8 && TackleSuccess ) {
			
			// GAMEPLAY TWEAK
			// Hay posibildiades de tackle, pero tenemos que tirar el dado.
			var probSteal : float = GetStealProbability();
			var tRandom = Random.value;
			if ( tRandom <= probSteal ) {
				gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_GetControl");
			} else {
				gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_EndTackle");
				PhysicBall.GetComponent(SoccerBall).Owner.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Dodge");
			}
			
		
		} else if ( tDistance < 0.8 && !TackleSuccess ) {
		
			gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_EndTackle");
			PhysicBall.GetComponent(SoccerBall).Owner.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Dodge");
		
		}
		
	}

}

function GetTackleTarget ( mouseWipe : Vector3 ) {

	return gameObject.transform.position + mouseWipe.normalized * TackleDistance ;

}

function GetTackleOpponentTarget () {

	return gameObject.transform.position + ( (PhysicBall.transform.position - gameObject.transform.position).normalized * TackleDistance ) ;

}

function CheckRecover () {

	var tDistance : float = Vector3.Distance(gameObject.transform.position, PhysicBall.transform.position);
	
	if ( tDistance < 0.8 ) {
		gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_GetControl");
	}

}

function GetDodgeAnimation () {

	if ( TeamOpponent.GetComponent(SoccerTeam).ChasingPlayer.GetComponent(PlayMakerFSM).ActiveStateName == "WaitOpponent" ) {
		return "Bicicleta_corta";
	}
	return "Regate_Salto";
	
}

function GetDribbleTarget () {

	// Si va por la banda, seguimos corriendo la banda
	// Si va por el centro, nos dirigimos a posición de tiro

	/*if ( Mathf.Abs(gameObject.transform.position.x) > Pitch.GetComponent(SoccerPitch).PenaltyAreaHeight/2 ) {

		return Vector3(gameObject.transform.position.x, 0, ShootingPosition.transform.position.z);
	
	} else {*/
	
		if ( Mathf.Abs(gameObject.transform.position.x) < Pitch.GetComponent(SoccerPitch).GoalAreaHeight/2 ) {
		
			return Vector3(gameObject.transform.position.x, 0, ShootingPosition.transform.position.z);
		
		} else {
			
			if (gameObject.transform.position.x > 0) {
				return Vector3(Pitch.GetComponent(SoccerPitch).GoalAreaHeight/2, 0, ShootingPosition.transform.position.z);
			} else {
				return Vector3(-Pitch.GetComponent(SoccerPitch).GoalAreaHeight/2, 0, ShootingPosition.transform.position.z);
			}
			
		}
	//}

}

function GetTargetPosition ( tMode : String ) {

	if ( tMode == "Defend" ) {
		return GetDefensivePosition();
	} else if ( tMode == "Attack" ) {
		return GetAttackingPosition();
	} else {
		return GetSupportPosition();
	}

}

function GetDefensivePosition () {

	// Cálculo Z
	
	var dirOpponentGoal : Vector3 = Vector3(0,0,Team.GetComponent(SoccerTeam).ShootingPosition.transform.position.z - DefensivePosition.transform.position.z).normalized;
	var dirOwnGoal : Vector3 = Vector3(0,0,TeamOpponent.GetComponent(SoccerTeam).ShootingPosition.transform.position.z - DefensivePosition.transform.position.z).normalized;
	
	var zGoalOwn : Vector3 = Vector3(0,0,TeamOpponent.GetComponent(SoccerTeam).ShootingPosition.transform.position.z);
	var zGoalOpponent : Vector3 = Vector3(0,0,Team.GetComponent(SoccerTeam).ShootingPosition.transform.position.z);
	
	var zBall : Vector3 = Vector3(0,0,PhysicBall.transform.position.z);
	var zDefensivePosition : Vector3 = Vector3(0,0,DefensivePosition.transform.position.z) + (dirOwnGoal*Pitch.GetComponent(SoccerPitch).RegionLength/3);
	
	// Cálculo X
	
	var xBall : Vector3 = Vector3(PhysicBall.transform.position.x,0,0);
	var xDefensivePosition : Vector3 = Vector3(DefensivePosition.transform.position.x,0,0);
	
	var regionBall : int = Mathf.Floor( (xBall.x - (-Pitch.GetComponent(SoccerPitch).PitchWidth/2)) / Pitch.GetComponent(SoccerPitch).RegionWidth );
	var regionDefensivePosition : int = Mathf.Floor( (xDefensivePosition.x - (-Pitch.GetComponent(SoccerPitch).PitchWidth/2)) / Pitch.GetComponent(SoccerPitch).RegionWidth );
	
	var zPosition : Vector3;
	var xPosition : Vector3;
	xPosition = xDefensivePosition;	
	
	var tPercent = Vector3.Distance(zGoalOwn,zBall)/Vector3.Distance(zGoalOwn,zGoalOpponent);
	var tLength : float;
	var tRetraso : float;
	
	switch ( Position ) {
	
		case "DEF":

			// Un poco más atrasados
			tLength = Pitch.GetComponent(SoccerPitch).RegionLength * 2;
			tRetraso = 0.3;
			zPosition = zDefensivePosition + ( dirOwnGoal * tLength * tRetraso ) + ( dirOpponentGoal * tLength * tPercent );
			
			/*
			Vector3(zBall-zGoalOwn)/(Pitch.GetComponent(SoccerPitch).RegionLength*2);
			
			// Límites de la región de la defensa
			if ( Vector3.Distance(zGoalOwn,zPosition) < Vector3.Distance(zGoalOwn,zDefensivePosition+(dirOwnGoal*Pitch.GetComponent(SoccerPitch).RegionLength)) ) {
				zPosition = zDefensivePosition+(dirOwnGoal*Pitch.GetComponent(SoccerPitch).RegionLength);
			} else if ( Vector3.Distance(zGoalOwn,zPosition) > Vector3.Distance(zGoalOwn,zDefensivePosition+(dirOpponentGoal*Pitch.GetComponent(SoccerPitch).RegionLength)) ) {
				zPosition = zDefensivePosition+(dirOpponentGoal*Pitch.GetComponent(SoccerPitch).RegionLength);
			}
			
			xPosition = xDefensivePosition;	
			*/		
			
		break;
		case "MID":
			
			tLength = Pitch.GetComponent(SoccerPitch).RegionLength * 3;
			zPosition = zDefensivePosition + ( dirOwnGoal * tLength / 2 ) + ( dirOpponentGoal * tLength * tPercent );
						
			/*
			zPosition = zBall+(dirOpponentGoal*-8);
			// Límites de la región de medio campo
			if ( Vector3.Distance(zGoalOwn,zPosition) < Vector3.Distance(zGoalOwn,zDefensivePosition+(dirOwnGoal*Pitch.GetComponent(SoccerPitch).RegionLength*2)) ) {
				zPosition = zDefensivePosition+(dirOwnGoal*Pitch.GetComponent(SoccerPitch).RegionLength*2);
			} else if ( Vector3.Distance(zGoalOwn,zPosition) > Vector3.Distance(zGoalOwn,zDefensivePosition+(dirOpponentGoal*Pitch.GetComponent(SoccerPitch).RegionLength*2)) ) {
				zPosition = zDefensivePosition+(dirOpponentGoal*Pitch.GetComponent(SoccerPitch).RegionLength*2);
			}			
			
			xPosition = xDefensivePosition;	
			*/
			
		break;
		case "FOR":
			
			tLength = Pitch.GetComponent(SoccerPitch).RegionLength * 2;
			tRetraso = 0.7;
			zPosition = zDefensivePosition + ( dirOwnGoal * tLength * tRetraso ) + ( dirOpponentGoal * tLength * tPercent );
						
			/*
			zPosition = zBall+(dirOpponentGoal*-8);
			
			if ( Vector3.Distance(zGoalOwn,zPosition) < Vector3.Distance(zGoalOwn,zDefensivePosition+(dirOwnGoal*Pitch.GetComponent(SoccerPitch).RegionLength*0.5)) ) {
				// Más cerca de nuestra portería
				zPosition = zDefensivePosition+(dirOwnGoal*Pitch.GetComponent(SoccerPitch).RegionLength*0.5);
			} else if ( Vector3.Distance(zGoalOwn,zPosition) > Vector3.Distance(zGoalOwn,zDefensivePosition+(dirOpponentGoal*Pitch.GetComponent(SoccerPitch).RegionLength*1.5)) ) {
				// Más cerca de la portería contraria
				zPosition = zDefensivePosition+(dirOpponentGoal*Pitch.GetComponent(SoccerPitch).RegionLength*1.5);
			}
			*/
			
		break;

	}

	return( Vector3(xPosition.x,0,zPosition.z) ); 

}

function GetAttackingPosition () {
	
	// Cálculo Z
	
	var dirOpponentGoal : Vector3 = Vector3(0,0,Team.GetComponent(SoccerTeam).ShootingPosition.transform.position.z - AttackingPosition.transform.position.z).normalized;
	var dirOwnGoal : Vector3 = Vector3(0,0,TeamOpponent.GetComponent(SoccerTeam).ShootingPosition.transform.position.z - AttackingPosition.transform.position.z).normalized;
	
	var zGoalOwn : Vector3 = Vector3(0,0,TeamOpponent.GetComponent(SoccerTeam).ShootingPosition.transform.position.z);
	var zGoalOpponent : Vector3 = Vector3(0,0,Team.GetComponent(SoccerTeam).ShootingPosition.transform.position.z);
	
	var zBall : Vector3 = Vector3(0,0,PhysicBall.transform.position.z);
	var zAttackingPosition : Vector3 = Vector3(0,0,AttackingPosition.transform.position.z) + (dirOwnGoal*Pitch.GetComponent(SoccerPitch).RegionLength/3);
	
	// Cálculo X
	
	var xBall : Vector3 = Vector3(PhysicBall.transform.position.x,0,0);
	var xAttackingPosition : Vector3 = Vector3(AttackingPosition.transform.position.x,0,0);
	
	var regionBall : int = Mathf.Floor( (xBall.x - (-Pitch.GetComponent(SoccerPitch).PitchWidth/2)) / Pitch.GetComponent(SoccerPitch).RegionWidth );
	var regionAttackingPosition : int = Mathf.Floor( (xAttackingPosition.x - (-Pitch.GetComponent(SoccerPitch).PitchWidth/2)) / Pitch.GetComponent(SoccerPitch).RegionWidth );
	
	var zPosition : Vector3;
	var xPosition : Vector3;
	xPosition = xAttackingPosition;
	
	// Corregimos las posiciones de X
	
	if ( Team.GetComponent(SoccerTeam).ControllingPlayer != null ) {
		
		var regionControllingPlayer : int = Mathf.Floor( (Team.GetComponent(SoccerTeam).ControllingPlayer.GetComponent(FieldPlayer).AttackingPosition.transform.position.x - (-Pitch.GetComponent(SoccerPitch).PitchWidth/2)) / Pitch.GetComponent(SoccerPitch).RegionWidth );
		if ( Position == Team.GetComponent(SoccerTeam).ControllingPlayer.GetComponent(FieldPlayer).Position )
			xPosition = xBall + ( (xAttackingPosition - xBall).normalized * Pitch.GetComponent(SoccerPitch).RegionWidth * Mathf.Abs(regionControllingPlayer - regionAttackingPosition) * 0.7 );
	
	}
	// Corregimos las posiciones de Z 
	
	var tPercent = Vector3.Distance(zGoalOwn,zBall)/Vector3.Distance(zGoalOwn,zGoalOpponent);
	var tLength : float;
	var tRetraso : float;
	
	switch ( Position ) {
	
		case "DEF":
			
			tLength = Pitch.GetComponent(SoccerPitch).RegionLength * 2;
			tRetraso = 0.3;
			zPosition = zAttackingPosition + ( dirOwnGoal * tLength * tRetraso ) + ( dirOpponentGoal * tLength * tPercent );
						
			/*
			// Un poco más adelantados
			zPosition = zBall+(dirOpponentGoal*-3);
			// Límites de la región de la defensa
			if ( Vector3.Distance(zGoalOwn,zPosition) < Vector3.Distance(zGoalOwn,zAttackingPosition+(dirOwnGoal*Pitch.GetComponent(SoccerPitch).RegionLength)) ) {
				zPosition = zAttackingPosition+(dirOwnGoal*Pitch.GetComponent(SoccerPitch).RegionLength);
			} else if ( Vector3.Distance(zGoalOwn,zPosition) > Vector3.Distance(zGoalOwn,zAttackingPosition+(dirOpponentGoal*Pitch.GetComponent(SoccerPitch).RegionLength)) ) {
				zPosition = zAttackingPosition+(dirOpponentGoal*Pitch.GetComponent(SoccerPitch).RegionLength);
			}
			
			xPosition = xAttackingPosition;				
			*/
			// Si la lleva un defensa... le acompañamos. Si no, a posición "base"
			
			/*
			if ( Team.GetComponent(SoccerTeam).ControllingPlayer != null ) {
				if ( Team.GetComponent(SoccerTeam).ControllingPlayer.GetComponent(FieldPlayer).Position == "DEF" ) {
					// Desplazados hacia el que conduce
					xPosition = xBall + ( (xAttackingPosition - xBall).normalized * Pitch.GetComponent(SoccerPitch).RegionWidth * Mathf.Abs(regionBall-regionAttackingPosition) * 0.5 );
				}
			} else {
				xPosition = xAttackingPosition;
				zPosition = zAttackingPosition;
			}*/
			
			/*
			zPosition = zBall+(dirOwnGoal*zDist);
			if ( Vector3.Distance(zGoalOwn,zPosition) < Vector3.Distance(zGoalOwn,zAttackingPosition+(dirOwnGoal*Pitch.GetComponent(SoccerPitch).RegionLength)) ) {
				// Más cerca de nuestra portería
				zPosition = zAttackingPosition+(dirOwnGoal*Pitch.GetComponent(SoccerPitch).RegionLength);
			} else if ( Vector3.Distance(zGoalOwn,zPosition) > Vector3.Distance(zGoalOwn,zAttackingPosition+(dirOpponentGoal*Pitch.GetComponent(SoccerPitch).RegionLength)) ) {
				// Más cerca de la portería contraria
				zPosition = zAttackingPosition+(dirOpponentGoal*Pitch.GetComponent(SoccerPitch).RegionLength);
			}
			*/
			
		break;
		case "MID":
			
			tLength = Pitch.GetComponent(SoccerPitch).RegionLength * 4;
			zPosition = zAttackingPosition + ( dirOwnGoal * tLength / 2 ) + ( dirOpponentGoal * tLength * tPercent );
						
			/*
			zPosition = zBall+(dirOpponentGoal*10);
			// Límites de la región de medio campo
			if ( Vector3.Distance(zGoalOwn,zPosition) < Vector3.Distance(zGoalOwn,zAttackingPosition+(dirOwnGoal*Pitch.GetComponent(SoccerPitch).RegionLength*2)) ) {
				zPosition = zAttackingPosition+(dirOwnGoal*Pitch.GetComponent(SoccerPitch).RegionLength*2);
			} else if ( Vector3.Distance(zGoalOwn,zPosition) > Vector3.Distance(zGoalOwn,zAttackingPosition+(dirOpponentGoal*Pitch.GetComponent(SoccerPitch).RegionLength*2)) ) {
				zPosition = zAttackingPosition+(dirOpponentGoal*Pitch.GetComponent(SoccerPitch).RegionLength*2);
			}			
			
			xPosition = xAttackingPosition;	
			*/
			/*
			if ( Team.GetComponent(SoccerTeam).ControllingPlayer != null ) {
			
				if ( Team.GetComponent(SoccerTeam).ControllingPlayer.GetComponent(FieldPlayer).Position == "DEF" ) {
				

					
					var regionControllingPlayer : float = Mathf.Floor( (Team.GetComponent(SoccerTeam).ControllingPlayer.GetComponent(FieldPlayer).AttackingPosition.transform.position.x - (-Pitch.GetComponent(SoccerPitch).PitchWidth/2)) / Pitch.GetComponent(SoccerPitch).RegionWidth );
					var xShift : float;
					
					if ( xBall.x < 0 ) {
						xShift = -0.5;
					} else {
						xShift = 0.5;
					}
					
					//Debug.Log(regionControllingPlayer + ", " + gameObject + ": " + (regionAttackingPosition-regionControllingPlayer+xShift) );
					xShift = regionAttackingPosition-regionControllingPlayer+xShift;
					xPosition = xBall + Vector3( xShift*Pitch.GetComponent(SoccerPitch).RegionWidth*0.7,0,0);
					
					zPosition += dirOpponentGoal*Mathf.Abs(xShift)*2 ;
					
					
				
				} else if ( Team.GetComponent(SoccerTeam).ControllingPlayer.GetComponent(FieldPlayer).Position == "MID" ) {
					
					if ( Mathf.Abs(regionBall-regionAttackingPosition) == 1 ) {
						xPosition = xBall + ( (xAttackingPosition - xBall).normalized * 5 );
						zPosition = zAttackingPosition+(dirOpponentGoal*10);
					}
				}
			}
			*/
			
		break;
		case "FOR":
			
			tLength = Pitch.GetComponent(SoccerPitch).RegionLength * 3;
			tRetraso = 0.7;
			zPosition = zAttackingPosition + ( dirOwnGoal * tLength * tRetraso ) + ( dirOpponentGoal * tLength * tPercent );
						
			/*
			zPosition = zBall+(dirOpponentGoal*8);
			
			if ( Vector3.Distance(zGoalOwn,zPosition) < Vector3.Distance(zGoalOwn,zAttackingPosition+(dirOwnGoal*Pitch.GetComponent(SoccerPitch).RegionLength*1.5)) ) {
				// Más cerca de nuestra portería
				zPosition = zAttackingPosition+(dirOwnGoal*Pitch.GetComponent(SoccerPitch).RegionLength*1);
			} else if ( Vector3.Distance(zGoalOwn,zPosition) > Vector3.Distance(zGoalOwn,zAttackingPosition+(dirOpponentGoal*Pitch.GetComponent(SoccerPitch).RegionLength*0.4)) ) {
				// Más cerca de la portería contraria
				zPosition = zAttackingPosition+(dirOpponentGoal*Pitch.GetComponent(SoccerPitch).RegionLength*0.5);
			}
			*/
			// Siempre buscamos la mejor posición, siempre damos soporte.
			/*
			if ( Team.GetComponent(SoccerTeam).ControllingPlayer != null ) {
			
				if ( Team.GetComponent(SoccerTeam).ControllingPlayer.GetComponent(FieldPlayer).Position == "MID" ) {
					// Nos colocamos en la mejor posición
				}
				
			}
			*/
		
		break;

		
	}
	
	

	return( Vector3(xPosition.x,0,zPosition.z) ); 

}

function GetSupportPosition () {

	var dirOpponentGoal : Vector3 = Vector3(0,0,Team.GetComponent(SoccerTeam).ShootingPosition.transform.position.z - gameObject.transform.position.z).normalized;
	var zBall : Vector3 = Vector3(0,0,PhysicBall.transform.position.z);
	var xBall : Vector3 = Vector3(PhysicBall.transform.position.x,0,0);
	
	//gameObject.transform.forward * 
	
	var zPosition : Vector3 = zBall + ( dirOpponentGoal * 14 );
	var xPosition : Vector3 = xBall + ((Vector3(gameObject.transform.position.x,0,0)-xBall).normalized*6) ;
	
	if ( xPosition.x < -Pitch.GetComponent(SoccerPitch).PitchWidth/2+1 ) {
		xPosition.x = -Pitch.GetComponent(SoccerPitch).PitchWidth/2+1;
	} else if ( xPosition.x > Pitch.GetComponent(SoccerPitch).PitchWidth/2-1 ) {
		xPosition.x = Pitch.GetComponent(SoccerPitch).PitchWidth/2-1;
	}

	return( Vector3(xPosition.x,0,zPosition.z) );

}

function RunTowards ( target : Vector3 ) {

	// Dependiendo de lo lejos, corre o anda
	
	var tDistancia : float = Vector3.Distance(gameObject.transform.position, target);
	var tVel : Vector3 = (target-gameObject.transform.position).normalized;
	var tToBall : Vector3 = ( Vector3(PhysicBall.transform.position.x, 0, PhysicBall.transform.position.z) - gameObject.transform.position ).normalized;
	var tNewPosition : Vector3;
	var tPlayerAnimation : Animation = gameObject.transform.FindChild("Player").gameObject.GetComponent.<Animation>();
	var tAngleBallTarget : float;
	var tAnim : String;
	
	if (tDistancia < 1) {
	
		// Mensaje de andar
		gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_WalkTowards");
		
	} else {
	
		// Sprintamos o corremos en función de la distancia
		var tMoveSpeed : float = (tDistancia > 4) ? SprintSpeed : RunSpeed;
	
		// Corremos mirando al destino
		tNewPosition = gameObject.transform.position + (tVel * (tMoveSpeed*Time.deltaTime));
		gameObject.transform.position = tNewPosition;
		gameObject.transform.LookAt(target);
		
		if ( !tPlayerAnimation.IsPlaying("Correr") ) {
			tPlayerAnimation.GetComponent.<Animation>().CrossFade("Correr",0.3);
		}
	
	}

}

function WalkTowards ( target : Vector3 ) {

	// Dependiendo de lo lejos, corre o anda
	
	var tDistancia : float = Vector3.Distance(gameObject.transform.position, target);
	var tVel : Vector3 = (target-gameObject.transform.position).normalized;
	var tToBall : Vector3 = ( Vector3(PhysicBall.transform.position.x, 0, PhysicBall.transform.position.z) - gameObject.transform.position ).normalized;
	var tNewPosition : Vector3;
	var tPlayerAnimation : Animation = gameObject.transform.FindChild("Player").gameObject.GetComponent.<Animation>();
	var tAngleBallTarget : float;
	var tAnim : String;
	
	if (tDistancia > 3) {
	
		// Mensaje de correr
		gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_RunTowards");
	
	} else if (tDistancia > 0.5 ) {
	
		// Andamos mirando a la bola
		tNewPosition = gameObject.transform.position + (tVel * (WalkSpeed*Time.deltaTime));
		gameObject.transform.position = tNewPosition;
		gameObject.transform.LookAt(PhysicBall.transform);
		
		tAngleBallTarget = Vector3.Angle(tVel,tToBall);
		
		if ( tAngleBallTarget < 25 ) {
			tAnim = "Correr";
		} else if ( tAngleBallTarget >= 25 && tAngleBallTarget < 155 ) {
			tAnim = "Andar_Lado_Der";
		} else {
			tAnim = "Andar_Atras";
		}
		
		if ( !tPlayerAnimation.IsPlaying(tAnim) ) {
			tPlayerAnimation.GetComponent.<Animation>().CrossFade(tAnim,0.3);
		}		
	
	}

}

function OnDeceptionEnd () {

	if ( Team.GetComponent(PlayMakerFSM).ActiveStateName == "Attacking" ) {
		gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Attack");
	} else if ( Team.GetComponent(PlayMakerFSM).ActiveStateName == "Defending" ) {
		gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Defend");
	} else {
		gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Wait");
	}

}


function GetStealProbability () {

	var probSteal : float = ProbTackle + PhysicBall.GetComponent(SoccerBall).Owner.GetComponent(FieldPlayer).ProbDodge;

	if ( TheGameController.GetComponent(GameController).Dificulty == 0 ) {
		if ( Team.name == "TeamOpponent" ) {
			probSteal -= 0.2;
		} else {
			probSteal += 0.1;
		}
	} else {
		if ( Team.name == "TeamOwn" ) {
			probSteal -= 0.2;
		} else {
			probSteal += 0.1;
		}
	}						
	
	return probSteal;

}

