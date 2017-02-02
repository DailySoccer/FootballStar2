#pragma strict

var GoalKeeper : GameObject;

var FieldPlayer1 : GameObject;
var FieldPlayer2 : GameObject;
var FieldPlayer3 : GameObject;
var FieldPlayer4 : GameObject;
var FieldPlayer5 : GameObject;
var FieldPlayer6 : GameObject;
var FieldPlayer7 : GameObject;
var FieldPlayer8 : GameObject;
var FieldPlayer9 : GameObject;
var FieldPlayer10 : GameObject;

var Ball : GameObject;
var PhysicBall : GameObject;
var ShootingPosition : GameObject;
var TeamOpponent : GameObject;
var Pitch : GameObject;

/*
@System.NonSerialized
var ReceivingPlayer : GameObject;
*/
@System.NonSerialized
var ControllingPlayer : GameObject;
@System.NonSerialized
var SupportingPlayer : GameObject;
@System.NonSerialized
var ChasingPlayer : GameObject;
@System.NonSerialized
var ChasingMode : String;
@System.NonSerialized
var RecoveringPlayer : GameObject;
@System.NonSerialized
var InteractivePlayer : GameObject;
@System.NonSerialized
var PlayersList : GameObject[]; // La accede el equipo contrario para testar cosas (como los pases

private var TargetPosition : Vector3;
private var RecoverMode : String;

private var TheGameController : GameObject;

function Awake () {
	
	PlayersList = new GameObject[11];
	
	PlayersList[0] = GoalKeeper;
	PlayersList[1] = FieldPlayer1;
	PlayersList[2] = FieldPlayer2;
	PlayersList[3] = FieldPlayer3;
	PlayersList[4] = FieldPlayer4;
	PlayersList[5] = FieldPlayer5;
	PlayersList[6] = FieldPlayer6;
	PlayersList[7] = FieldPlayer7;
	PlayersList[8] = FieldPlayer8;
	PlayersList[9] = FieldPlayer9;
	PlayersList[10] = FieldPlayer10;

	TheGameController = GameObject.Find("GameController");

}


function Update () {

}

// Funciones propias de los estados

function InitStart () {

	// Seteamos las posiciones home defensivas y colocamos a los jugadores
	
	for (var i : int = 1; i < PlayersList.length; i++) {
		
		PlayersList[i].GetComponent(PlayMakerFSM).Fsm.Event("Msg_Init");
			
		PlayersList[i].GetComponent(FieldPlayer).SetHomeDefensivePosition();
		if ( PlayersList[i] != ChasingPlayer ) {
			PlayersList[i].transform.position = PlayersList[i].GetComponent(FieldPlayer).HomePosition;
			PlayersList[i].GetComponent(PlayMakerFSM).Fsm.Event("Msg_GoHome");
			
		}
	
	}
	
	// Colocamos el portero
	
	GoalKeeper.transform.position = GoalKeeper.GetComponent(SoccerGoalKeeper).HomePosition.transform.position;
	GoalKeeper.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Init");

}

function SavedInitStart () {

	// Seteamos las posiciones home defensivas y colocamos a los jugadores
	
	for (var i : int = 1; i < PlayersList.length; i++) {
	
		//PlayersList[i].GetComponent(FieldPlayer).SetHomeDefensivePosition();
		
		if ( PlayersList[i] != ChasingPlayer ) {
			//PlayersList[i].transform.position = PlayersList[i].GetComponent(FieldPlayer).HomePosition;
			//PlayersList[i].GetComponent(PlayMakerFSM).Fsm.Event("Msg_GoHome");
		}
	
	}

}

// ************************************************************
// Recovering
// ************************************************************

function RecoveringStart () {

	// En primer lugar, comprobamos si es tiro a puerta
	// Si es tiro a puerta y el tiro es a nuestra portería, enviamos mensaje de reacción al portero.

	var tShotAtGoal : String = PhysicBall.GetComponent(SoccerBall).ShotAtGoal;

	if ( !String.IsNullOrEmpty( tShotAtGoal ) ) {
		
		RecoveringPlayer = null;
		
		var tMyGoal : String = gameObject.name + "Goal";
	
		// Si es tiro a nuestra puerta, le decimos al portero que reaccione
		if ( tMyGoal == tShotAtGoal ) {
			//Debug.Break();
			GoalKeeper.GetComponent(PlayMakerFSM).Fsm.Event("Msg_ShotAtGoalReaction");
		}
		
		// Si hay ChasingPlayer, lo enviamos a casa
		if ( ChasingPlayer != null )
			ChasingPlayer.GetComponent(PlayMakerFSM).Fsm.Event("Msg_GoHome");
	
	} else if ( gameObject.GetComponent(PlayMakerFSM).Fsm.PreviousActiveState.Name == "Init" || gameObject.GetComponent(PlayMakerFSM).Fsm.PreviousActiveState.Name == "Recovering" ) {
		
		// Comienzo o vuelta de un tiro a puerta. No hay jugadores prohibidos
		GetRecoveringPlayer( null );
		
		if ( RecoveringPlayer != null ) {
			if ( RecoveringPlayer == GoalKeeper )
				RecoveringPlayer.GetComponent(SoccerGoalKeeper).TargetPosition = TargetPosition;
			else
				RecoveringPlayer.GetComponent(FieldPlayer).TargetPosition = TargetPosition;
			RecoveringPlayer.GetComponent(PlayMakerFSM).Fsm.Event("Msg_ChaseBall");
		}		
	
	} else if ( gameObject.GetComponent(PlayMakerFSM).Fsm.PreviousActiveState.Name == "Defending" ) {
	
		// El contrario ha hecho un pase ( tiro a puerta flojo)
		
		GetRecoveringPlayer( null );
		
		if ( RecoveringPlayer != null ) {
			
			if ( RecoveringPlayer == GoalKeeper ) {
			
				RecoveringPlayer.GetComponent(SoccerGoalKeeper).TargetPosition = TargetPosition;
			
			} else {
				
				// GAMEPLAY TWEAK
				if ( TheGameController.GetComponent(GameController).Dificulty == 0 ) {
					if ( gameObject.name == "TeamOpponent" ) {
						RecoveringPlayer = null;
					} else {
						RecoveringPlayer.GetComponent(FieldPlayer).TargetPosition = TargetPosition;
					}
				} else {
					if ( gameObject.name == "TeamOpponent" ) {
						RecoveringPlayer.GetComponent(FieldPlayer).TargetPosition = TargetPosition;
					} else {
						RecoveringPlayer = null;
					}
				}
			
			}
			
			if ( RecoveringPlayer != null ) {
				RecoveringPlayer.GetComponent(PlayMakerFSM).Fsm.Event("Msg_ChaseBall");
			}

						
			/* CÓDIGO ORIGINAL SIN GAMEPLAY TWEAK
			
			if ( RecoveringPlayer == GoalKeeper )
				RecoveringPlayer.GetComponent(SoccerGoalKeeper).TargetPosition = TargetPosition;
			else
				RecoveringPlayer.GetComponent(FieldPlayer).TargetPosition = TargetPosition;
			RecoveringPlayer.GetComponent(PlayMakerFSM).Fsm.Event("Msg_ChaseBall");
			*/
			
			
			
		}
		
		// Si ChasingPlayer es distinto de RecoveryPlayer le enviamos a home.
		// Lo hacemos porque por si mismo se quedará esperando a recuperar la bola (por ejemplo, tras llegar al punto de intercepción)
		if ( RecoveringPlayer != ChasingPlayer)
			ChasingPlayer.GetComponent(PlayMakerFSM).Fsm.Event("Msg_GoHome");
		
	
	} else if ( gameObject.GetComponent(PlayMakerFSM).Fsm.PreviousActiveState.Name == "Attacking" ) {
	
		// Yo he hecho un pase -> El ControllingPlayer no puede ser el RecoveringPlayer.
		GetRecoveringPlayer( ControllingPlayer );
		
		if ( RecoveringPlayer != null ) {
			if ( RecoveringPlayer == GoalKeeper )
				RecoveringPlayer.GetComponent(SoccerGoalKeeper).TargetPosition = TargetPosition;
			else
				RecoveringPlayer.GetComponent(FieldPlayer).TargetPosition = TargetPosition;
			
			RecoveringPlayer.GetComponent(PlayMakerFSM).Fsm.Event("Msg_ChaseBall");
		}
		
		// GAMEPLAY TWEAK
		
		if ( RecoverMode == "FINAL" ) {
			TeamOpponent.GetComponent(SoccerTeam).ForceRecover();
		}
		
	
	}
	
	ChasingPlayer = null;
	ControllingPlayer = null;
			
}


function RecoveringUpdate () {

	// Comprobamos quien ha ganado control del balón
	// Si ha sido un contrario, transicionamos a defending
	// Si lo hemos ganado nosotros, transicionamos a attacking
	
	if ( PhysicBall.GetComponent(SoccerBall).Owner != null ) {
	
		if ( PhysicBall.GetComponent(SoccerBall).Owner.GetComponent(FieldPlayer).Team != gameObject ) {
		
			gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Defend");
		
		} else {
			
			gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Attack");
		
		}
	
	}

}

function ForceRecover () {

	// GAMEPLAY TWEAK
	if ( RecoveringPlayer == null ) {
		GetRecoveringPlayer( null );
		if ( RecoveringPlayer != null ) {
			if ( RecoveringPlayer == GoalKeeper )
				RecoveringPlayer.GetComponent(SoccerGoalKeeper).TargetPosition = TargetPosition;
			else
				RecoveringPlayer.GetComponent(FieldPlayer).TargetPosition = TargetPosition;
			RecoveringPlayer.GetComponent(PlayMakerFSM).Fsm.Event("Msg_ChaseBall");
		}
		
	}
}

// ************************************************************
// Defending
// ************************************************************

function DefendingStart () {
	
	
	if ( gameObject.GetComponent(PlayMakerFSM).Fsm.PreviousActiveState.Name == "Init" ) {
		
		// Caso imposible
		
	
	} else if ( gameObject.GetComponent(PlayMakerFSM).Fsm.PreviousActiveState.Name == "Recovering" ) {
	
		// El contrario ha ganado control del balón que estaba suelto
		// El RecoveringPlayer puede ser el ChasingPlayer
		GetChasingPlayer( null );
		 
	
	} else if ( gameObject.GetComponent(PlayMakerFSM).Fsm.PreviousActiveState.Name == "Attacking" ) {
	
		// El contrario nos ha robado el balón
		// El ControllingPlayer NO puede ser el ChasingPlayer, está en estado de decepción
		GetChasingPlayer( ControllingPlayer );
			
	}
	
	// Enviamos el resto de jugadores a home
	for (var i : int = 1; i < PlayersList.length; i++) {
		PlayersList[i].GetComponent(FieldPlayer).SetHomeDefensivePosition();
		// Enviamos a home a todos salvo al ChasingPlayer y al ControllingPlayer, que se irá solo.
		if ( PlayersList[i] != ChasingPlayer && PlayersList[i] != ControllingPlayer ) {
			PlayersList[i].GetComponent(PlayMakerFSM).Fsm.Event("Msg_Defend");
		}
	}
	
	// Si el RecoveringPlayer era el portero, lo enviamos a home
	if ( RecoveringPlayer == GoalKeeper ) {
		GoalKeeper.GetComponent(PlayMakerFSM).Fsm.Event("Msg_ReturnHome");
	}

	if ( ChasingPlayer != null ) {
		
		ChasingPlayer.GetComponent(FieldPlayer).TargetPosition = TargetPosition;
		
		if ( ChasingMode == "Chasing" ) 
			ChasingPlayer.GetComponent(PlayMakerFSM).Fsm.Event("Msg_ChaseOpponent");
		else if ( ChasingMode == "Intercepting" ) 
			ChasingPlayer.GetComponent(PlayMakerFSM).Fsm.Event("Msg_InterceptOpponent");
	}
	
	RecoveringPlayer = null;
	ControllingPlayer = null;
	
}


function DefendingUpdate () {
	
	if ( PhysicBall.GetComponent(SoccerBall).Owner != null ) {
	
		if ( PhysicBall.GetComponent(SoccerBall).Owner.GetComponent(FieldPlayer).Team == gameObject ) {
		
			// Ganamos congtrol del balón
			gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Attack");
		
		} else if ( ChasingPlayer != null ) {
		
			if ( ChasingPlayer.GetComponent(PlayMakerFSM).ActiveStateName == "Deception" ) { 
				// El ChasingPlayer ha fracasado, buscamos otro
				// El Antiguo ChasingPlayer volverá sólo a home tras la animación de decepción
				GetChasingPlayer( ChasingPlayer );
				ChasingPlayer.GetComponent(FieldPlayer).TargetPosition = TargetPosition;

				if ( ChasingMode == "Chasing" ) 
					ChasingPlayer.GetComponent(PlayMakerFSM).Fsm.Event("Msg_ChaseOpponent");
				else if ( ChasingMode == "Intercepting" ) 
					ChasingPlayer.GetComponent(PlayMakerFSM).Fsm.Event("Msg_InterceptOpponent");
			}

		}
	
	} else {
	
		// El contrario ha pasado el balón
		gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Recover");
	
	}

}

// ************************************************************
// Attacking
// ************************************************************

function AttackingStart () {


	if ( gameObject.GetComponent(PlayMakerFSM).Fsm.PreviousActiveState.Name == "Init" ) {
		
		// Caso imposible
		
	
	} else if ( gameObject.GetComponent(PlayMakerFSM).Fsm.PreviousActiveState.Name == "Recovering" ) {
	
		// Hemos recuperado el balón que estata suelto
		// El ControllingPlayer será el owner del balón
		ControllingPlayer = PhysicBall.GetComponent(SoccerBall).Owner;
	
	} else if ( gameObject.GetComponent(PlayMakerFSM).Fsm.PreviousActiveState.Name == "Defending" ) {
	
		// Hemos robado el balón
		// El ControllingPlayer será el owner
		ControllingPlayer = PhysicBall.GetComponent(SoccerBall).Owner;
		
	}

	// Calculamos el supporting player y lo enviamos a hacer support
	var tSupportingPlayer : GameObject = GetSupportingPlayer();
	if ( tSupportingPlayer != null )
		tSupportingPlayer.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Support");
	
	// Mandamos a atacar a todos los jugadores salvo al que conduce el balón
	for (var i : int = 1; i < PlayersList.length; i++) {
		PlayersList[i].GetComponent(FieldPlayer).SetHomeAttackingPosition();
		if ( PlayersList[i] != ControllingPlayer && PlayersList[i] != tSupportingPlayer ) {
			PlayersList[i].GetComponent(PlayMakerFSM).Fsm.Event("Msg_Attack");
		}		
	}
	
	RecoveringPlayer = null;
	ChasingPlayer = null;

}

function AttackingUpdate () {

	if ( PhysicBall.GetComponent(SoccerBall).Owner != null ) {
		
		// Nos han robado el balón
		if ( PhysicBall.GetComponent(SoccerBall).Owner.GetComponent(FieldPlayer).Team != gameObject ) {
			gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Defend");
		}
			
	} else {
	
		// Hemos intentado pase
		gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Recover");
	
	}	

}

// ************************************************************
// Funciones
// ************************************************************

function GetRecoveringPlayer ( tForbiddenPlayer : GameObject ) {
	
	RecoverMode = "INTERCEPT";
	
	var tClosestPlayer : GameObject;
	var tTarget : Vector3;
	var tNewDistance : float;
	var tMinDistance : float = 2000;
	var i : int;
	
	if ( PhysicBall.GetComponent(SoccerBall).Owner == null ) {
		
		if ( PhysicBall.GetComponent(SoccerBall).IsMoving ) {
			
			// Comprobamos si hay algún jugador que pueda cortar la bola antes de que se pare, interponiéndose.
			
			var velocidad : Vector3 = Vector3( PhysicBall.GetComponent(SoccerBall).Velocity.x, 0, PhysicBall.GetComponent(SoccerBall).Velocity.z ).normalized;
			var normalVel : Vector3 = Quaternion.AngleAxis( 90, Vector3.up) * velocidad;
			var planoPerpendicular : Plane = new Plane( velocidad, PhysicBall.transform.position );
			var planoParalelo : Plane = new Plane( normalVel, PhysicBall.transform.position );
			var ray : Ray;
			var rayDistance : float;
			
			var tInitTarget : Vector3;
			var tNewTarget : Vector3;
			var tFinalTarget : Vector3;
			var tNewBallDistance : float;
			//var tHayCorte : boolean = false;
			var tPosibilidadCorte : boolean = false;
			var tTargetCounter : int = 0;
			
			var tBallTime : float;
			var tPlayerTime : float;

									
			for (i = 1; i < PlayersList.length; i++) {
				
				//if ( planoPerpendicular.GetSide(PlayersList[i].transform.position) && PlayersList[i] != tForbiddenPlayer ) {
				
				if ( PlayersList[i] != tForbiddenPlayer && PlayersList[i].GetComponent(PlayMakerFSM).ActiveStateName != "Deception" ) {	
					
					// Por optimizar, primero comprobamos si puede cortar en el punto óptimo (perpendicular desde el jugador hasta la trayectoria de la bola).
					// Si no hay corte en el punto óptimo, comprobamos si se puede cortar antes de que la bola llegue a su destino.
					
					ray = Ray( PlayersList[i].transform.position, normalVel );
					planoParalelo.Raycast(ray,rayDistance);
					
					if ( rayDistance != 0 ) { // Esta comprobación debería sobrar...
						
						tPosibilidadCorte = true;
						tInitTarget = PlayersList[i].transform.position + (normalVel*rayDistance);
						tBallTime = PhysicBall.GetComponent(SoccerBall).GetTimeToReachDistance(PhysicBall.GetComponent(SoccerBall).Velocity, Vector3.Distance(PhysicBall.transform.position, tInitTarget) );
						tPlayerTime = Vector3.Distance(PlayersList[i].transform.position,tInitTarget) / PlayersList[i].GetComponent(FieldPlayer).ChaseBallSpeed;
						
						if ( tPlayerTime > tBallTime || !planoPerpendicular.GetSide(PlayersList[i].transform.position) ) {
							// No hay corte en el punto óptimo
							// Comprobamos si lo hay antes de que la bola llegue a su destino
							tInitTarget =  PhysicBall.GetComponent(SoccerBall).ShootTarget;
							tBallTime = PhysicBall.GetComponent(SoccerBall).GetTimeToReachDistance(PhysicBall.GetComponent(SoccerBall).Velocity, Vector3.Distance(PhysicBall.transform.position, tInitTarget) );
							tPlayerTime = Vector3.Distance(PlayersList[i].transform.position,tInitTarget) / PlayersList[i].GetComponent(FieldPlayer).ChaseBallSpeed;
							if ( tPlayerTime > tBallTime ) {
								//Debug.Log("DETERMINAMOS QUE NO HAY POSIBILIDAD DE CORTE: " + PhysicBall.GetComponent(SoccerBall).Velocity + ", " + Vector3.Distance(PhysicBall.transform.position, tInitTarget) + ", " + tPlayerTime + ", " + tBallTime );
								tPosibilidadCorte = false;
							}
						}
						
					}
					
					// Optimización
					
					// Si hay posibilidad de corte, buscamos el punto de corte más cercano a la bola. El tiempo será el que tarde en interceptar.
						// El target el punto de corte.
					// Si no hay posibilidad de corte, vemos si hay corte antes de que la bola llegue a su destino.
						// El tiempo será el que tarde en interceptar. El target el punto de corte.
					// Si no puede llegar, el jugador irá a recogerla a su punto final. El tiempo será el que tarde en llegar el jugador.
						// El target el punto de destino de la bola.
					
					if ( tPosibilidadCorte ) {
					
						// Hay corte, buscamos el punto más cercano al punto de partida de la bola
					
						tTargetCounter = 0;
						//tHayCorte = false;
						do {
							tNewBallDistance = Vector3.Distance(PhysicBall.transform.position, tInitTarget) - tTargetCounter;
							if ( tNewBallDistance > 0 ) {
								tNewTarget = PhysicBall.transform.position + ( (tInitTarget - PhysicBall.transform.position).normalized * tNewBallDistance );
								tBallTime = PhysicBall.GetComponent(SoccerBall).GetTimeToReachDistance(PhysicBall.GetComponent(SoccerBall).Velocity, Vector3.Distance(PhysicBall.transform.position, tNewTarget) );
								tPlayerTime = Vector3.Distance(PlayersList[i].transform.position,tNewTarget) / PlayersList[i].GetComponent(FieldPlayer).ChaseBallSpeed;
								if ( tPlayerTime <= tBallTime ) {
									tFinalTarget = tNewTarget;
									tTargetCounter++;
								} else {
									break;
								}
							} 
						} while ( tNewBallDistance > 0 );
						
						// La distancia

						tNewDistance = Vector3.Distance( PlayersList[i].transform.position, tFinalTarget );
						//tNewDistance = Vector3.Distance( PhysicBall.transform.position, tFinalTarget );
						if ( tNewDistance < tMinDistance ) {
							
							tClosestPlayer = PlayersList[i];
							tMinDistance = tNewDistance;
							tTarget = tFinalTarget;
							//Debug.Log("CLOSEST PLAYER: " + tClosestPlayer + ", " + tTarget);
						}						
						
					} else {
					
						//Debug.Log("NO HAY POSIBILIDAD DE CORTE");
					
					}
				
				}
				
			}
			
			//Debug.Log("CLOSEST PLAYER: " + tClosestPlayer + ", " + tTarget);
			
			// Si ningún jugador puede cortar, buscamos el más cercano al target de la bola (siempre que caiga dentro del campo)
			
			if ( tClosestPlayer == null && PhysicBall.GetComponent(SoccerBall).ShotInside ) {
				
				//Debug.Log("NO CORTAMOS BUSCAMOS CERCANO AL TARGET DE LA BOLA");
				
				RecoverMode = "FINAL";
				
				tTarget = PhysicBall.GetComponent(SoccerBall).ShootTarget;
				
				var areaTeamOwn : Rect = new Rect(-Pitch.GetComponent(SoccerPitch).PitchLength/2, -Pitch.GetComponent(SoccerPitch).PenaltyAreaHeight/2, Pitch.GetComponent(SoccerPitch).PenaltyAreaWidth, Pitch.GetComponent(SoccerPitch).PenaltyAreaHeight );
				var areaTeamOpponent : Rect = new Rect(Pitch.GetComponent(SoccerPitch).PitchLength/2-Pitch.GetComponent(SoccerPitch).PenaltyAreaWidth, -Pitch.GetComponent(SoccerPitch).PenaltyAreaHeight/2, Pitch.GetComponent(SoccerPitch).PenaltyAreaWidth, Pitch.GetComponent(SoccerPitch).PenaltyAreaHeight );
				var areaMe : Rect;
				var areaOther : Rect;
				
				if ( gameObject.name == "TeamOwn" ) {
					areaMe = areaTeamOwn;
					areaOther = areaTeamOpponent;
				} else {
					areaMe = areaTeamOpponent;
					areaOther = areaTeamOwn;
				}
				
				if ( areaOther.Contains( Vector2(PhysicBall.GetComponent(SoccerBall).ShootTarget.z,PhysicBall.GetComponent(SoccerBall).ShootTarget.x) ) ) {
				
					// Área contraria, no hacemos nada, de momento.
				
				} else if ( areaMe.Contains( Vector2(PhysicBall.GetComponent(SoccerBall).ShootTarget.z,PhysicBall.GetComponent(SoccerBall).ShootTarget.x) ) ) {
					
					// Nuestra área, la busca el portero. 		
					
					tClosestPlayer = GoalKeeper;
				
				} else {
				
					// Cualquier otra zona del campo. Buscamos el jugador más cercano.
				
					for (i = 1; i < PlayersList.length; i++) {
					
						tNewDistance = Vector3.Distance( PlayersList[i].transform.position, tTarget );
						
						if ( tNewDistance < tMinDistance && PlayersList[i] != tForbiddenPlayer && PlayersList[i].GetComponent(PlayMakerFSM).ActiveStateName != "Deception" ) {
							tClosestPlayer = PlayersList[i];
							tMinDistance = tNewDistance;
						}
						
					}
				
				}
			
			}			
		
		} else {
			
			// La bola está parada. El punto target es la posición de la bola
			
			RecoverMode = "FINAL";
			
			tTarget = Vector3(PhysicBall.transform.position.x,0,PhysicBall.transform.position.z);
			
			for (i = 1; i < PlayersList.length; i++) {
				
				tNewDistance = Vector3.Distance( PlayersList[i].transform.position, tTarget );
				if ( tNewDistance < tMinDistance && PlayersList[i] != tForbiddenPlayer && PlayersList[i].GetComponent(PlayMakerFSM).ActiveStateName != "Deception" ) {
					tClosestPlayer = PlayersList[i];
					tMinDistance = tNewDistance;
				}	
				
			}
		
		}
	
	}
	
	if ( tClosestPlayer != null ) {
		RecoveringPlayer = tClosestPlayer;
		TargetPosition = tTarget;
	} else {
		// Será null únicamente cuando la bola caiga en el área contraria ...
		// ... o cuando vaya fuera y no podamos cortarla
		RecoveringPlayer = null;
	}

}

function GetChasingPlayer ( tForbiddenPlayer : GameObject ) {

	var tClosestPlayer : GameObject;
	var tMinDistance : float = 2000; // Valor alto, para la primera comparación... chapuza
	var tNewDistance : float;
	var tTarget : Vector3;
	var tNewTargetV2 : Vector2;
	var tNewTargetV3 : Vector3;
	var tPursuing : boolean = false;
	var i : int;
	
	var xBall : Vector3 = Vector3(PhysicBall.transform.position.x,0,0);
	var xOwn : Vector3 = Vector3(gameObject.transform.position.x,0,0);
	var xGoal : Vector3 = Vector3(TeamOpponent.GetComponent(SoccerTeam).ShootingPosition.transform.position.x,0,0);
	
	// En estado de ataque, el jugador más cercano a la bola siempre es el ControllingPlayer
	// En estado de defensa:
		// Si la bola está libre y parada, el target es la posición de la bola y el ChasingPlayer es el más cercano
		// Si la bola está libre y en movimiento, el ChasingPlayer es el mejor para incerceptar y el target el punto de intercepción
		// Si la bola está controlada por el contrario, elChasingPlayer es el que tarda menos en interceptar y el target el punto de intercepción
	
	if ( PhysicBall.GetComponent(SoccerBall).Owner != null ) {
	
		for (i = 1; i < PlayersList.length; i++) {
			
			// GAMEPLAY TWEAK
			// En modo difícil, nosotros no entramos por detrás
			if ( TheGameController.GetComponent(GameController).Dificulty == 0 ) {
				if ( gameObject.name == "TeamOpponent" ) {
					if ( Vector3.Distance(xBall,xGoal) < Vector3.Distance(xOwn,xGoal) ) {
						 break;
					}
				}
			} else {
				if ( gameObject.name == "TeamOwn" ) {
					if ( Vector3.Distance(xBall,xGoal) < Vector3.Distance(xOwn,xGoal) ) {
						 break;
					}
				}
			}
			/*
			if ( Vector3.Distance(xBall,xGoal) < Vector3.Distance(xOwn,xGoal) ) {
				 break;
			}
			*/
			var A : Vector2 = Vector2(PhysicBall.GetComponent(SoccerBall).Owner.transform.position.x,PhysicBall.GetComponent(SoccerBall).Owner.transform.position.z);
			var Av : Vector2 = Vector2(PhysicBall.GetComponent(SoccerBall).Owner.transform.forward.x,PhysicBall.GetComponent(SoccerBall).Owner.transform.forward.z).normalized * PhysicBall.GetComponent(SoccerBall).Owner.GetComponent(FieldPlayer).DribbleSpeed;
			var B : Vector2 = Vector2(PlayersList[i].transform.position.x,PlayersList[i].transform.position.z);
			var Bs : float = PlayersList[i].GetComponent(FieldPlayer).RunSpeed;

			tNewTargetV2 = GetPointOfInterception( A, Av, B, Bs);
			
			if ( tNewTargetV2 != Vector3(-2000,-2000) ) {
			
				tNewTargetV3 = Vector3(tNewTargetV2.x, 0, tNewTargetV2.y);
				tNewDistance = Vector3.Distance(PlayersList[i].transform.position, tNewTargetV3);
				
				if (tNewDistance < tMinDistance && PlayersList[i] != tForbiddenPlayer && PlayersList[i].GetComponent(PlayMakerFSM).ActiveStateName != "Deception" ) {
					tClosestPlayer = PlayersList[i];
					tMinDistance = tNewDistance;
					tTarget = tNewTargetV3;
				}
				
			}
			
		}
	
	}

	// Si el contrario está por delante y en un ángulo menor de n grados, en lugar de chase es intercepting
	ChasingMode = "Chasing"; 
	if ( tClosestPlayer != null ) {
		/*
		var angulo : float = Vector3.Angle(PhysicBall.GetComponent(SoccerBall).Owner.transform.forward, (tClosestPlayer.transform.position - PhysicBall.GetComponent(SoccerBall).Owner.transform.position) );
		if ( angulo < 16 && gameObject.name == "TeamOpponent" ) {
			var distanciaFar : float = Vector3.Distance(PhysicBall.GetComponent(SoccerBall).Owner.transform.position,tClosestPlayer.transform.position) * Mathf.Cos(angulo*Mathf.Deg2Rad);
			var distanciaNear : float = (tTarget - PhysicBall.GetComponent(SoccerBall).Owner.transform.position).magnitude;
			tTarget = tTarget + ( PhysicBall.GetComponent(SoccerBall).Owner.transform.forward * ((distanciaFar-distanciaNear)/2) );
			ChasingMode = "Intercepting";
		}
		*/
		ChasingPlayer = tClosestPlayer;
		TargetPosition = tTarget;
	} else {
		ChasingPlayer = null;
	}

}

function GetPointOfInterception ( A : Vector2, Av : Vector2, B : Vector2, Bs : float ) {

	// Usado para el cálculo del punto de intercepción con la bola o con el contrario
	 
	// A : posición del objeto A (la bola o el jugador que conduce)
	// Av : Vector velocidad del objeto A
	// B : posición del objeto B (el jugador que quiere interceptar)
	// Bs: Speed del objeto B (módulo del vector velocidad)
	// Bv : Velocidad del objeto B (vector), desconocido
	
	var Bv : Vector2;
	
	var tAlpha : float = ( A.y - B.y ) / ( A.x - B.x );
	var tBeta : float = ( tAlpha * Av.x ) - Av.y;
	
	var a : float = 1 + Mathf.Pow(tAlpha,2);
	var b : float = -2 * tAlpha * tBeta;
	var c : float = Mathf.Pow(tBeta,2) - Mathf.Pow(Bs,2);
	var d : float = Mathf.Sqrt( Mathf.Pow(b,2) - (4*a*c) );
	
	var tBvx_A : float = ( - b + d ) / (2 * a);
	var tBvx_B : float = ( - b - d ) / (2 * a);
		
	var tTA : float = ( A.x - B.x ) / ( tBvx_A - Av.x );
	var tTB : float = ( A.x - B.x ) / ( tBvx_B - Av.x );
	
	var tT : float;
	
	if ( tTA > 0 ) {
		tT = tTA;
		if ( tTB > 0 && tTB < tTA ) {
			tT = tTB;
		} 
	} else if ( tTB > 0 ) {
		tT = tTB;
	}
	
	if (tT != 0 && !float.IsNaN(tT)) {
		
		var pointOfInterception : Vector2 = A + ( Av * tT);
		return pointOfInterception;
		
	}
	
	return Vector2(-2000,-2000);

}

function GetTeamMateToPass ( tPlayer : GameObject ) {

	// Recorro todos los miembres de mi equipo
	// Compruebo si está en posición más adelantada
	// Compruebo si hay jugadores contrarios en la línea de pase
	// Si hay más de un jugador en buenas condiciones, elijo al más cercano
	// Debería comprobar cual de todos está en mejor posición, por ejemplo, por cercanía a jugadores contrarios y si tienen jugadores por delante
	// Devuelvo el GameObject jugador
	
	var zShootingpos : float = ShootingPosition.transform.position.z;
	var zOwn : float = tPlayer.transform.position.z;
	var zTargetPlayer : float;
	
	var rayDirection : Vector3;
	var rayPoint : Vector3;
	var hit : RaycastHit; 

	var target : GameObject;

	for (var i : int = 1; i < PlayersList.length; i++) {
		
		// Comprobamos los que no son el que pregunta
		
		if ( PlayersList[i] != tPlayer ) {
			zTargetPlayer = PlayersList[i].transform.position.z;
			if ( Mathf.Abs(zShootingpos-zTargetPlayer) < Mathf.Abs(zShootingpos-zOwn) ) {
				// Comprobamos que ningún oponente interfiere en el disparo
				rayDirection = PlayersList[i].transform.position - tPlayer.transform.position;
				rayDirection.Normalize();
				rayPoint = tPlayer.transform.position + Vector3(0,1,0) + (rayDirection*1.5);
				if ( Physics.Raycast(rayPoint,rayDirection,hit) ) {
					if (hit.collider.gameObject == PlayersList[i]) {
						if (target != null) {
							//if ( Vector3.Distance(Team.GetComponent(SoccerTeam).PlayersList[i].transform.position, gameObject.transform.position) < Vector3.Distance(target.transform.position, gameObject.transform.position) )
							if ( Random.value < 0.5 ) {
								target = PlayersList[i];
								break;
							}
						}
						else {
							target = PlayersList[i];
						}
					}
				}
				
			}
		
		}

	}

	if (target != null)
		return target;
}

function GetSupportingPlayer () {

	// Si el controlling es defensa, buscamos entre los medios
	// Si el controlling es medio, buscamos entre los delanteros
	// Si el controlling es delantero, el otro delantero
	
	var tDistance : float;
	var tMinDistance : float = 2000;
	var tPlayer : GameObject;
	
	for (var i : int = 1; i < PlayersList.length; i++) {

		if ( PlayersList[i] != ControllingPlayer ) {
		
			if ( ( ControllingPlayer.GetComponent(FieldPlayer).Position == "DEF" && PlayersList[i].GetComponent(FieldPlayer).Position == "MID" ) ||
			( ControllingPlayer.GetComponent(FieldPlayer).Position == "MID" && PlayersList[i].GetComponent(FieldPlayer).Position == "FOR" ) ) {
				
				tDistance = Vector3.Distance(PlayersList[i].transform.position,ControllingPlayer.transform.position);
				if ( tDistance < tMinDistance ) {
					tMinDistance = tDistance;
					tPlayer = PlayersList[i];
				}
			
			}
		
		}
	
	}
	
	return tPlayer;

}

