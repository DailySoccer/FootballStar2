#pragma strict

var HomePosition : GameObject;
var Ball : GameObject;
var PhysicBall : GameObject;
var Team : GameObject;
var TeamOpponent : GameObject;
var RunSpeed : float;

@System.NonSerialized
var TargetPosition : Vector3; // La escribe el equipo, necesaria para saber dónde ir en caso de que seamos los más cercanos
@System.NonSerialized
var SaveAnim : String;
@System.NonSerialized
var SavePosition : Vector3;
@System.NonSerialized
var SaveSpeed : float; // Punto en el que la bola atravesará el plano del portero
@System.NonSerialized
var SaveTime : float;

private var animsTimes : Hashtable;
private var animsMaxTimes : Hashtable;
private var animsHorDesp : Hashtable;
private var saveZoneWidth : float = 1.11;
private var saveZoneHeight : float = 0.75;
private var gkPlane : Plane; // Normal
private var gkAnimation : Animation;
private var ThereIsSave : boolean;

private var TheGameController : GameObject;


function Start () {

	animsTimes = new Hashtable();
	
	animsTimes["Q0_L0_Despeja"] = 0.4;
	animsTimes["Q0_L1_Despeja"] = 0.47;
	animsTimes["Q0_L2_Despeja"] = 0.67;
	
	animsTimes["Q1_L0_DER_Despeja"] = 0.27;
	animsTimes["Q1_L0_IZQ_Despeja"] = 0.27;
	animsTimes["Q1_L1_DER_Despeja"] = 0.23;
	animsTimes["Q1_L1_IZQ_Despeja"] = 0.23;
	animsTimes["Q1_L2_DER_Despeja"] = 0.30;
	animsTimes["Q1_L2_IZQ_Despeja"] = 0.30;
	
	animsTimes["Q2_L0_DER_Despeja"] = 0.90;
	animsTimes["Q2_L0_IZQ_Despeja"] = 0.90;
	animsTimes["Q2_L1_DER_Despeja"] = 0.77;
	animsTimes["Q2_L1_IZQ_Despeja"] = 0.77;
	animsTimes["Q2_L2_DER_Despeja"] = 0.60;
	animsTimes["Q2_L2_IZQ_Despeja"] = 0.60;
	
	animsMaxTimes = new Hashtable();
	
	animsMaxTimes["Q0_L0"] = 0.3;
	animsMaxTimes["Q0_L1"] = 0.3;
	animsMaxTimes["Q0_L2"] = 0.4;
	
	animsMaxTimes["Q1_L0"] = 0.4;
	animsMaxTimes["Q1_L1"] = 0.4;
	animsMaxTimes["Q1_L2"] = 0.5;
	
	animsMaxTimes["Q2_L0"] = 0.5;
	animsMaxTimes["Q2_L1"] = 0.5;
	animsMaxTimes["Q2_L2"] = 0.8;
	
	animsHorDesp = new Hashtable();
	
	animsHorDesp["Q0_L0_Despeja"] = 0.26;
	animsHorDesp["Q0_L1_Despeja"] = 0;
	animsHorDesp["Q0_L2_Despeja"] = 0;
	
	animsHorDesp["Q1_L0_DER_Despeja"] = 0.95;
	animsHorDesp["Q1_L0_IZQ_Despeja"] = 0.93;
	animsHorDesp["Q1_L1_DER_Despeja"] = 0.85;
	animsHorDesp["Q1_L1_IZQ_Despeja"] = 0.87;
	animsHorDesp["Q1_L2_DER_Despeja"] = 0.51;
	animsHorDesp["Q1_L2_IZQ_Despeja"] = 0.48;
	
	animsHorDesp["Q2_L0_DER_Despeja"] = 1.21;
	animsHorDesp["Q2_L0_IZQ_Despeja"] = 1.21;
	animsHorDesp["Q2_L1_DER_Despeja"] = 1.12;
	animsHorDesp["Q2_L1_IZQ_Despeja"] = 1.16;
	animsHorDesp["Q2_L2_DER_Despeja"] = 1.13;
	animsHorDesp["Q2_L2_IZQ_Despeja"] = 1.11;

	TheGameController = GameObject.Find("GameController");

}

function Update () {

}

function CalculatePosition () {

	// Si la bola no va dentro de la pista, no nos movemos
	
	if ( PhysicBall.GetComponent(SoccerBall).Owner != null || PhysicBall.GetComponent(SoccerBall).ShotInside ) {
	
		var tNewPosition = GetKeepingPosition();
		var gkAnimation : Animation = gameObject.transform.FindChild("Player_Local").gameObject.GetComponent.<Animation>();
		
		if ( PhysicBall.GetComponent.<Rigidbody>().velocity.x > 2 ) {

			if ( !gkAnimation.IsPlaying("Andar_Lado_Der") ) {
				gkAnimation.GetComponent.<Animation>().CrossFade("Andar_Lado_Der",0.2);
			}
		
		} else if ( PhysicBall.GetComponent.<Rigidbody>().velocity.x < -2 ) {

			if ( !gkAnimation.IsPlaying("Andar_Lado_Izq") ) {
				gkAnimation.CrossFade("Andar_Lado_Izq",0.2);
			}
		
		} else {
			
			if ( !gkAnimation.IsPlaying("Idle_Defensa") ) {
				gkAnimation.CrossFade("Idle_Defensa",0.2);
			}
			
		}
		
		gameObject.transform.position = tNewPosition;
		gameObject.transform.LookAt(Ball.transform.position);
		
		CheckDespeje ();
	
	}
	
}

function GetKeepingPosition() {

	var tNewPosition = (Ball.transform.position - HomePosition.transform.position);
	tNewPosition = HomePosition.transform.position + (tNewPosition.normalized * 4);
	return tNewPosition;

}

function PassToTeamMate ( tTeamMate : GameObject ) {

	ShootToTarget(tTeamMate.transform.position);

}

function DoCasillas () {

	var puntoAleatorio : Vector3 = Vector3(-25+(Random.value*50),0,-10+(Random.value*20));
	ShootToTarget(puntoAleatorio);

}

function ShootToTarget (tTarget : Vector3) {

	gameObject.transform.LookAt(tTarget);
	PhysicBall.GetComponent(SoccerBall).ShootToTarget(tTarget);

}

// Tratamos de parar el disparo

function CalculateSave () {

	var goalKeeperPlane : Plane = Plane( gameObject.transform.forward, gameObject.transform.position );
	var shootingDirection : Vector3 = Vector3( PhysicBall.GetComponent(SoccerBall).Velocity.x, 0, PhysicBall.GetComponent(SoccerBall).Velocity.z );
	var ray : Ray = Ray( Ball.transform.position, shootingDirection );
	var rayDistance : float;
	
	ThereIsSave = false;
	
	// Comprobamos si cruza el plano del portero (si puede haber parada
	
	if (goalKeeperPlane.Raycast(ray, rayDistance)) {
	
		// Punto donde estará la bola al cruzar el plano del portero
		var crossingPoint : Vector3 = PhysicBall.GetComponent(SoccerBall).GetPositionDistance( PhysicBall.GetComponent(SoccerBall).Velocity, rayDistance );
		
		//GameObject.Find("DummyTeamOwn").transform.position = crossingPoint;
		
		// Tiempo que tarda en llegar al plano del portero
		var crossingTime : float = PhysicBall.GetComponent(SoccerBall).GetTimeToReachDistance( PhysicBall.GetComponent(SoccerBall).Velocity, rayDistance );
		
		if ( crossingTime > -1 ) {

			// Determinamos si estamos dentro de la zona de parada y del tiempo 
			
			var saveDistance : float = (Vector2(crossingPoint.x,crossingPoint.z)-Vector2(gameObject.transform.position.x, gameObject.transform.position.z)).magnitude;
			
			if ( saveDistance <= saveZoneWidth*2.5 && crossingPoint.y <= saveZoneHeight*3 ) {
			
				// Determinamos si va por la derecha o por la izquierda
				var vPortero : Vector3 = gameObject.transform.position - PhysicBall.transform.position;
				vPortero.y = 0;
				var vSave : Vector3 = crossingPoint - PhysicBall.transform.position;
				vSave.y = 0;
				var lado : String;
				var horDesp : float = Vector3.Cross(vPortero,vSave).y;
				if ( horDesp < 0 )
					lado = "IZQ";
				else
					lado = "DER";
			
				// Zona Q
				var zoneQ : String;
				if ( saveDistance <= saveZoneWidth/2 ) {
					zoneQ = "Q0";
				} else if ( saveDistance > saveZoneWidth/2 && saveDistance <= saveZoneWidth*1.5 ) {
					zoneQ = "Q1";
				} else {
					zoneQ = "Q2";
				}
				
				// Zona L
				var zoneL : String;
				if ( crossingPoint.y <= saveZoneHeight ) {
					zoneL = "L0";
				} else if ( crossingPoint.y > saveZoneHeight && crossingPoint.y <= saveZoneHeight*2 ) {
					zoneL = "L1";
				} else {
					zoneL = "L2";
				}
				
				SaveAnim = zoneQ + "_" + zoneL;
				if ( zoneQ != "Q0" )
					SaveAnim += "_" + lado;
				SaveAnim += "_Despeja";
				
				var maxTime : float = animsMaxTimes[zoneQ + "_" + zoneL];
				
				// Calculo del punto al que tendremos que llegar
				horDesp = animsHorDesp[SaveAnim];
				SavePosition = Vector3(crossingPoint.x, 0, crossingPoint.z) + ( (gameObject.transform.position - Vector3(crossingPoint.x, 0, crossingPoint.z)).normalized * horDesp );
				
				// GAMEPLAY TWEAK

				if ( TheGameController.GetComponent(GameController).Dificulty == 0 ) {
					// En dificultad baja, paramos en zonas Q0 y Q1, y el contrario para sólo en Q0
					if ( Team.name == "TeamOpponent" ) {
						if ( crossingTime >= maxTime && zoneQ == "Q0" ) {
							ThereIsSave = true;
						}
					} else {
						if ( crossingTime >= maxTime ) {
							ThereIsSave = true;
						}
					}
				} else {
					// En dificultad alta, sólo paramos si nos tiran al cuerpo, pero el contrario para en zonas Q0 y Q1
					if ( Team.name == "TeamOwn" ) {
						if ( crossingTime >= maxTime && zoneQ == "Q0" ) {
							ThereIsSave = true;
						}
					} else {
						if ( crossingTime >= maxTime ) {
							ThereIsSave = true;
						}
					}
				}
				/*
				if ( crossingTime >= maxTime && zoneQ == "Q0" ) {
					ThereIsSave = true;
				}
				*/
												
			} 
			
		}
	
	}
	
	if ( !ThereIsSave ) {
	
		// No hay parada
		// Elegimos animación fake
		
		var zoneQAnim : String;
		if ( zoneQ == "Q2" ) {
			zoneQAnim = "Q1";
		} else if ( zoneQ == "Q1" ) {
			zoneQAnim = "Q0";
		} else {
			zoneQAnim = "Q0"; //zoneQ;
		}
		
		zoneL = "L0";
		SaveAnim = zoneQAnim + "_" + zoneL;
		if ( zoneQAnim != "Q0" )
			SaveAnim += "_" + lado;
		
		SaveAnim += "_Despeja";	
	
	}
	
	// Guardamos el plano del portero, la animación puede mover el pivote del gameobject y se calcularía mal la parada
	
	gkPlane = goalKeeperPlane;
	gkAnimation = gameObject.transform.FindChild("Player_Local").gameObject.GetComponent.<Animation>();
	Debug.Log("Saveanim: " + gameObject + ", " + SaveAnim + ", " + animsTimes[SaveAnim] + ", " + crossingTime);
	var animTime : float = animsTimes[SaveAnim];
	if(animTime > crossingTime && crossingTime > 0) {
		gkAnimation.GetComponent.<Animation>()[SaveAnim].speed = animTime/crossingTime;
	} else {
		gkAnimation.GetComponent.<Animation>()[SaveAnim].speed = 1;
	}
	
	SaveTime = animTime;
	Invoke("DoSave", crossingTime - animTime);
	
}

function DoSave () {

	//gkAnimation.animation.Play(SaveAnim, PlayMode.StopAll);
	gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_DoSave");
	
}

function CheckSave () {
	
	if ( ThereIsSave ) {
	
		var futurePosition : Vector3 = PhysicBall.GetComponent(SoccerBall).GetPositionTime ( PhysicBall.GetComponent(SoccerBall).Velocity, Time.deltaTime );
		if ( !gkPlane.GetSide(futurePosition) ) {
			var newBallVelocity : Vector3 = Vector3.Reflect(PhysicBall.GetComponent(SoccerBall).Velocity, gkPlane.normal) * 0.1;
			PhysicBall.GetComponent(SoccerBall).DoShoot( newBallVelocity );
			
			// Enviamos mensaje a los equipos
			//Team.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Saved");
			//TeamOpponent.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Saved");
			
			// Nos volvemos a colocar
			//gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_ReturnHome");
		}
		
	}

}

function CheckRecover () {

	var tDistance : float = Vector3.Distance(gameObject.transform.position, PhysicBall.transform.position);
	
	if ( tDistance < 0.8 ) {
		CheckDespeje ();
		gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_ReturnHome");
	}

}

function CheckDespeje () {

	var tDistanceToBoal = Vector3.Distance(gameObject.transform.position,PhysicBall.transform.position);
	
	if ( tDistanceToBoal < 0.8 ) {
		
		var tTeamMate = Team.GetComponent(SoccerTeam).GetTeamMateToPass( gameObject );
		
		if ( tTeamMate != null ) {
		
			// GAMEPLAY TWEAK
			if ( Random.value < 0.000005 ) {
			
				DoCasillas();
				Team.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Saved");
				TeamOpponent.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Saved");				
			
			} else {
			
				PassToTeamMate(tTeamMate);
				Team.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Saved");
				TeamOpponent.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Saved");
			
			}
		
		} else {
		
			DoCasillas();
			Team.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Saved");
			TeamOpponent.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Saved");	
		
		}
	
	}

}

function GetControl () {

	
	// Si la bola está siendo conducida por alguien que no soy yo, comunicamos el cambio de propietario
	// Tenemos que comprobar que no soy yo para no perder el control tras volver del Dodge
	
	if ( PhysicBall.GetComponent(SoccerBall).Owner != null && PhysicBall.GetComponent(SoccerBall).Owner != gameObject ) {
		PhysicBall.GetComponent(SoccerBall).Owner.GetComponent(PlayMakerFSM).Fsm.Event("Msg_LoseControl");
	}
	
	PhysicBall.GetComponent(SoccerBall).Owner = gameObject;

}
