#pragma strict

@System.NonSerialized
var Owner : GameObject;
@System.NonSerialized
var IsMoving : boolean = false;
@System.NonSerialized
var ShootTarget : Vector3; // Target al que se dirige la bola cuando está en movimiento.
@System.NonSerialized
var Velocity : Vector3;
@System.NonSerialized
var ShotAtGoal : String;
@System.NonSerialized
var ShotInside : boolean;

var Pitch : GameObject;
var TeamOwn : GameObject;
var TeamOpponent : GameObject;

private var Radius : float = 0.11;
private var Gravity : Vector3 = Vector3(0,-9.81,0);
private var Bounciness : float = 0.4;
private var BouncinessTolerance : float = 1; // Magnitud de la velocidad en vertical en la que se considera que deja de botar
private var Friction : float = 12; 
private var Airborne : boolean; // Bola en el aire
private var FuturePosition : Vector3;
private var FutureTime : float;
private var FutureDistance : float;

private var PitchWallN : Plane;
private var PitchWallE : Plane;
private var PitchWallS : Plane;
private var PitchWallW : Plane;
private var GoalWallE : Plane;
private var GoalWallW : Plane;

// Valores de velocidad

function Start () {

	gameObject.transform.position.y = Radius; // Pegado al suelo en un principio
	//DoShoot( Vector3(-20,0,-10) );
	
	PitchWallN = Plane( Vector3(1,0,0), Vector3(-Pitch.GetComponent(SoccerPitch).PitchWidth/2,0,0) );
	PitchWallE = Plane( Vector3(0,0,-1), Vector3(0,0,Pitch.GetComponent(SoccerPitch).PitchLength/2) );
	PitchWallS = Plane( Vector3(-1,0,0), Vector3(Pitch.GetComponent(SoccerPitch).PitchWidth/2,0,0) );
	PitchWallW = Plane( Vector3(0,0,1), Vector3(0,0,-Pitch.GetComponent(SoccerPitch).PitchLength/2) );
	
	GoalWallE = Plane( Vector3(0,0,-1), Vector3(0,0,54.5) );
	GoalWallW = Plane( Vector3(0,0,1), Vector3(0,0,-54.5) );

}

function Update () {


}

// ************************************************************

function InitStart () {

	// Colocamos la bola
	
	var ballZ : float = -37; //( Random.value < 0.5 ) ? -27 : 27;
	
	var ballX : float = -(Pitch.GetComponent(SoccerPitch).PitchWidth-10)/2 + (Random.value * (Pitch.GetComponent(SoccerPitch).PitchWidth-10));
	gameObject.transform.position = Vector3(ballX, Radius, ballZ);
	
	ShotAtGoal = "";

}

function StartKinematic () {

	Velocity =  gameObject.GetComponent.<Rigidbody>().velocity;
	//gameObject.rigidbody.velocity = Vector3(0,0,0);
	//gameObject.rigidbody.angularVelocity = Vector3(0,0,0);
	gameObject.GetComponent.<Rigidbody>().isKinematic = true;
	
}

function UpdateKinematic () {

	if (Owner != null ) {
		
		var tDribblePoint : Vector3 = Owner.transform.FindChild("DribblePoint").gameObject.transform.position;
		tDribblePoint.y = Radius;	
		gameObject.transform.position = tDribblePoint;
		var floorPosition : Vector3 = Vector3(gameObject.transform.position.x,0,gameObject.transform.position.z);
		ShootTarget = floorPosition;
	
	} else if (IsMoving) {
	
		var tNewPosition : Vector3; 
		
		if ( Airborne ) {
		
			tNewPosition.x = gameObject.transform.position.x + (Velocity.x*Time.deltaTime);
			tNewPosition.y = gameObject.transform.position.y + (Velocity.y*Time.deltaTime) + (Gravity.y*Time.deltaTime*Time.deltaTime/2);
			tNewPosition.z = gameObject.transform.position.z + (Velocity.z*Time.deltaTime);
			
			if ( tNewPosition.y <= Radius ) {
			
				var tA : float = Gravity.y / 2;
				var tB : float = Velocity.y;
				var tC : float = gameObject.transform.position.y - Radius;
				var tD : float = Mathf.Sqrt( Mathf.Pow(tB,2) - (4*tA*tC) );
				var tTime : float;

				tTime = ( -tB + tD ) / ( 2*tA );
				if ( tTime < 0 )
					tTime = ( -tB - tD ) / ( 2*tA );
				
				if ( float.IsNaN(tTime) )
					tTime = 0;
				
				tNewPosition.x = gameObject.transform.position.x + (Velocity.x*tTime);
				tNewPosition.y = Radius;
				tNewPosition.z = gameObject.transform.position.z + (Velocity.z*tTime);
				
				Velocity.y = Velocity.y + (Gravity.y*tTime);
				Velocity.y = Velocity.y * -Bounciness;
				
				if ( Mathf.Abs(Velocity.y) <= BouncinessTolerance ) {
					Velocity.y = 0;
					Airborne = false;
				}
				
			} else {
				
				Velocity.y = Velocity.y + (Gravity.y*Time.deltaTime);
			
			}
					
		} else {
			
			tNewPosition = gameObject.transform.position + (Velocity*Time.deltaTime) + ( Velocity.normalized*-Friction*Time.deltaTime*Time.deltaTime/2 );
			
			Velocity = Velocity + ( Velocity.normalized*-Friction*Time.deltaTime );
			
			if ( Velocity.magnitude <= (Velocity.normalized*-Friction*Time.deltaTime).magnitude ) {
				IsMoving = false;
			}
		
		}
		
		gameObject.transform.position = tNewPosition;
		
		// Comprobamos si ha salido del campo. Mirando si ha sido fuera o gol.
		
		var futurePosition : Vector3 = GetPositionTime ( Velocity, Time.deltaTime );
		
		if (  PitchWallN.GetSide(gameObject.transform.position ) && !PitchWallN.GetSide(futurePosition) ) { 

			Reset();
		
		} else if ( PitchWallE.GetSide(gameObject.transform.position ) && !PitchWallE.GetSide(futurePosition) ) {

			if ( ShotAtGoal ) {
				// Es gol
			} else {
				// Es fuera
			}
			Reset();
		
		} else if ( PitchWallS.GetSide(gameObject.transform.position ) && !PitchWallS.GetSide(futurePosition) ) {

			Reset();
		
		} else if ( PitchWallW.GetSide(gameObject.transform.position ) && !PitchWallW.GetSide(futurePosition) ) {

			if ( ShotAtGoal ) {
				// Es gol
			} else {
				// Es fuera
			}
			Reset();
			
		}
		
		// Planos de colisión
		
		if ( ShotAtGoal && !GoalWallE.GetSide(futurePosition) ) {
			Velocity = Vector3.Reflect(Velocity, GoalWallE.normal);
			Velocity *= 0.2;
		} else if ( ShotAtGoal && !GoalWallW.GetSide(futurePosition) ) {
			Velocity = Vector3.Reflect(Velocity, GoalWallE.normal);
			Velocity *= 0.2;
		}
			
	}

}

function StartPhysic () {

	// Transformamos la velocity en velocity física
	gameObject.GetComponent.<Rigidbody>().isKinematic = false;
	gameObject.GetComponent.<Rigidbody>().velocity = Velocity;

}

function UpdatePhysic () {

	if (Owner != null ) {
		
		gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_BeKinematic");
		//StartKinematic();
	
	} else if (IsMoving) {
	
		if ( gameObject.GetComponent.<Rigidbody>().velocity.magnitude <= 0.5 ) {
			gameObject.GetComponent.<Rigidbody>().velocity = Vector3(0,0,0);
			gameObject.GetComponent.<Rigidbody>().angularVelocity = Vector3(0,0,0);
			IsMoving = false;
		}
		
		// Comprobamos si ha entrado en el campo, en ese caso la hacemos kinematica
		var tolerancia : float = 0.5;
		var rect : Rect = Rect (-Pitch.GetComponent(SoccerPitch).PitchLength/2 + tolerancia, -Pitch.GetComponent(SoccerPitch).PitchWidth/2 + tolerancia, Pitch.GetComponent(SoccerPitch).PitchLength - tolerancia*2, Pitch.GetComponent(SoccerPitch).PitchWidth - tolerancia*2);
			
		if ( rect.Contains( Vector2(gameObject.transform.position.z,gameObject.transform.position.x) ) ) {
			gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_BeKinematic");
			//StartKinematic();
		}
	
	}

}

// ************************************************************
// Funciones de previsión
// ************************************************************

function GetFinalPosition ( vInit : Vector3 ) : Vector3 {

	if ( vInit == Vector3(0,0,0) )
		vInit = Velocity;
	
	if ( GetFutureData ( vInit, 0, 0 ) )
		return FuturePosition;
	
	return Vector3(0,0,0);

}

function GetPositionTime ( vInit : Vector3, targetTime : float ) : Vector3 {

	if ( vInit == Vector3(0,0,0) )
		vInit = Velocity;
	
	if ( GetFutureData ( vInit, targetTime, 0 ) )
		return FuturePosition;
	
	return Vector3(0,0,0);

}

function GetPositionDistance ( vInit : Vector3, targetDistance : float ) : Vector3 {

	if ( vInit == Vector3(0,0,0) )
		vInit = Velocity;
	
	if ( GetFutureData ( vInit, 0, targetDistance ) )
		return FuturePosition;
	
	return Vector3(0,0,0); 

}

function GetTimeToReachDistance ( vInit : Vector3, targetDistance : float ) : float {

	if ( vInit == Vector3(0,0,0) )
		vInit = Velocity;
	
	if ( GetFutureData ( vInit, 0, targetDistance ) )
		return FutureTime;
	
	return -1;

}

function GetFutureData ( vInit : Vector3, targetTime : float, targetDistance : float ) : boolean {

	// Devuelvemos un objeto con la posición de la bola en el tiempo indicado o después de recorrer la distancia indicada
	// Además, devolvemos el tiempo que tarda en recorrerla y la distancia recorrida (dependiendo del caso puede ser redundante)
	// Si queremos la posición final, pasamos esos dos valores a 0

	var tVelocity : Vector3 = vInit;
	
	var tTime1 : float = 0;
	var tDistance1 : float;
	var tTime2 : float = 0;
	var tInitHeight : float = gameObject.transform.position.y;
	
	var tTime : float = 0; // Tiempo en el tramo de movimiento actual (botar o rodar)
	
	var tPosition : Vector3 = gameObject.transform.position; // Posición de la bola después al final del tramo de movimiento (bote o rodar)
	var tInitPosition : Vector3 = gameObject.transform.position;
	var tNewPosition : Vector3;

	var tTotalTime : float = 0; // Tiempo total en movimiento
	
	var ballData : Object;
	
	// Botando

	while ( Mathf.Abs(tVelocity.y) > BouncinessTolerance || tInitHeight >= Radius ) {
		
		// Hay que tener en cuenta si no salimos desde el suelo, por ejemplo, en los rebotes de portero o postes.
		if ( tInitHeight > 0 ) {
			tTime1 = -tVelocity.y/Gravity.y;
			tDistance1 = (tVelocity.y*tTime1) + (Gravity.y*Mathf.Pow(tTime1,2)/2) - Radius;
			tTime2 = Mathf.Sqrt( ( -2*(tDistance1+tInitHeight) ) / Gravity.y );
			tTime = tTime1 + tTime2;
			tInitHeight = 0;
			tVelocity.y = -Gravity.y * tTime2;
		} else {
			tTime = -2*tVelocity.y/Gravity.y;
		}
		
		tNewPosition = Vector3(tPosition.x,Radius,tPosition.z) + ( Vector3(tVelocity.x,0,tVelocity.z)*tTime );
		
		// Comprobamos si el targetTime o la targetDistance se alcanza en este bote
		
		if ( targetTime > 0 && tTotalTime + tTime >= targetTime ) {

			tTime = targetTime - tTotalTime;
			tPosition = tPosition + ( Vector3(tVelocity.x,0,tVelocity.z)*tTime );
			tPosition.y = (tVelocity.y*tTime) + (Gravity.y*tTime*tTime/2);
			FuturePosition = tPosition;
			FutureTime = targetTime;
			FutureDistance = (Vector2(tPosition.x,tPosition.z)-Vector2(tInitPosition.x,tInitPosition.z)).magnitude;
			return true;
			
		} else if ( targetDistance > 0 &&  (tNewPosition - tInitPosition).magnitude >= targetDistance  ) {

			tTime = ( targetDistance - (tPosition - tInitPosition).magnitude ) / Vector2(tVelocity.x,tVelocity.z).magnitude;
			tPosition = tPosition + ( Vector3(tVelocity.x,0,tVelocity.z)*tTime );
			tPosition.y = (tVelocity.y*tTime) + (Gravity.y*tTime*tTime/2);
			
			FuturePosition = tPosition;
			FutureTime = tTotalTime + tTime;
			FutureDistance = targetDistance;
			return true;
			
		} else {
		
			tTotalTime += tTime;
			tPosition = tNewPosition;
			tVelocity.y = tVelocity.y * Bounciness;
			
		}
		
	}
	
	// Rodando
	
	tVelocity.y = 0;
	tTime = tVelocity.magnitude/Friction;
	tNewPosition = tPosition + (tVelocity.normalized*-Friction*tTime*tTime/2) + (tVelocity*tTime);
	
	if ( targetTime > 0 ) {
		
		if ( tTotalTime + tTime >= targetTime ) {
	
			tTime = targetTime - tTotalTime;
			tPosition = tPosition + (tVelocity.normalized*-Friction*tTime*tTime/2) + (tVelocity*tTime);
			FuturePosition = tPosition;
			FutureTime = targetTime;
			FutureDistance = (Vector2(tPosition.x,tPosition.z)-Vector2(tInitPosition.x,tInitPosition.z)).magnitude;
			return true;
			
		} else {
		
			return false;
		
		}
	
	} else if ( targetDistance > 0 ) {
			
		if ( (tNewPosition - tInitPosition).magnitude >= targetDistance ) {
			
			var distance : float = targetDistance - (tPosition - tInitPosition).magnitude; // Distancia que nos queda por recorrer
			var velocity : float = tVelocity.magnitude;
			var futureTime1 : float = ( velocity + Mathf.Sqrt( (velocity*velocity) - (2*Friction*distance) ) ) / Friction;
			var futureTime2 : float = ( velocity - Mathf.Sqrt( (velocity*velocity) - (2*Friction*distance) ) ) / Friction;
			if (futureTime1 < futureTime2 )
				tTime = futureTime1;
			else
				tTime = futureTime2; 
			tPosition = tPosition + (tVelocity.normalized*-Friction*tTime*tTime/2) + (tVelocity*tTime);
			FuturePosition = tPosition;
			FutureTime = tTotalTime + tTime;
			FutureDistance = targetDistance;
			return true;
			
		} else {
		
			return false;
		
		}
	
	} else {
	
		tPosition = tNewPosition;
		FuturePosition = tPosition;
		FutureTime = tTotalTime + tTime;
		FutureDistance = (Vector2(tPosition.x,tPosition.z)-Vector2(tInitPosition.x,tInitPosition.z)).magnitude;
		return true;
	
	}

}

// ************************************************************
// Disparos
// ************************************************************

function ShootToTarget ( tTarget : Vector3 ) {

	// Calculamos que es siempre un tiro rodado, mejorar con tirco con arco
	
	gameObject.transform.position.y = Radius;
	tTarget.y = Radius;
	var tDistance : float = (tTarget - gameObject.transform.position).magnitude;
	var tSpeed : float = Mathf.Sqrt( 2*tDistance*Friction );
	var tVelocity : Vector3 = (tTarget - gameObject.transform.position).normalized * tSpeed;
	
	Velocity = tVelocity;
	Airborne = false;
	IsMoving = true;
	ShootTarget = tTarget;
	
	ShotAtGoal = CheckShotAtGoal ( Velocity );
	
	var pitchRect : Rect = new Rect(-Pitch.GetComponent(SoccerPitch).PitchLength/2,-Pitch.GetComponent(SoccerPitch).PitchWidth/2,Pitch.GetComponent(SoccerPitch).PitchLength,Pitch.GetComponent(SoccerPitch).PitchWidth);
	
	if ( pitchRect.Contains( Vector2( ShootTarget.z,ShootTarget.x ) ) ) {
		ShotInside = true;
	} else {
		ShotInside = false;
	}	

}

function DoShoot ( tVelocity : Vector3 ) {

	Velocity = tVelocity;
	
	if ( Velocity.y < 1 && gameObject.transform.position.y <= Radius ) {
		Velocity.y = 0;
		Airborne = false;
	} else {
		Airborne = true;
	}	
	
	IsMoving = true;
	ShootTarget = GetFinalPosition( Velocity );
	ShotAtGoal = CheckShotAtGoal ( Velocity );
	
	var pitchRect : Rect = new Rect(-Pitch.GetComponent(SoccerPitch).PitchLength/2,-Pitch.GetComponent(SoccerPitch).PitchWidth/2,Pitch.GetComponent(SoccerPitch).PitchLength,Pitch.GetComponent(SoccerPitch).PitchWidth);
	if ( pitchRect.Contains( Vector2( ShootTarget.z,ShootTarget.x ) ) ) {
		ShotInside = true;
	} else {
		ShotInside = false;
	}
	
	//Dummy.transform.position = GetPositionDistance( Velocity, 10 );

}

function CheckShotAtGoal( tVelocity : Vector3 ) : String {

	if ( tVelocity == Vector3(0,0,0) ) 
		tVelocity = Velocity;

	var tTeamOwn : GameObject = GameObject.Find("TeamOwn");
	var tTeamOpponent : GameObject = GameObject.Find("TeamOpponent");
	var tTeamName : String;

	var goalPlaneOwn : Plane = Plane( (Vector3(0,0,0) - tTeamOwn.GetComponent(SoccerTeam).ShootingPosition.transform.position).normalized, tTeamOwn.GetComponent(SoccerTeam).ShootingPosition.transform.position );
	var goalPlaneOpponent : Plane = Plane( (Vector3(0,0,0) - tTeamOpponent.GetComponent(SoccerTeam).ShootingPosition.transform.position).normalized, tTeamOpponent.GetComponent(SoccerTeam).ShootingPosition.transform.position );
	
	var shootingDirection : Vector3 = Vector3( tVelocity.x, 0, tVelocity.z );
	var ray : Ray = Ray( Vector3(gameObject.transform.position.x,0,gameObject.transform.position.z), shootingDirection );
	var rayDistance : float;
	var crossingPoint;
	
	if (goalPlaneOwn.Raycast(ray, rayDistance)) {
		crossingPoint = GetPositionDistance( tVelocity , rayDistance );
		tTeamName = "TeamOpponentGoal";
	} else if (goalPlaneOpponent.Raycast(ray, rayDistance)) {
		crossingPoint = GetPositionDistance( tVelocity , rayDistance );
		tTeamName = "TeamOwnGoal";
	}
	
	if ( crossingPoint != null )
		var crossingPointV3 : Vector3 = crossingPoint;
	
	if ( crossingPointV3 != Vector3(0,0,0) ) {
	
		// Entra en la portería?
		if ( crossingPointV3.x > -Pitch.GetComponent(SoccerPitch).GoalWidth/2 && crossingPointV3.x < Pitch.GetComponent(SoccerPitch).GoalWidth/2 && crossingPointV3.y < Pitch.GetComponent(SoccerPitch).GoalHeight ) {
			//GameObject.Find("Dummy").transform.position = crossingPointV3;
			return tTeamName;
		}
	
	}
	
	return String.Empty;

}

function Reset () {

	GameObject.Find("GameController").GetComponent(PlayMakerFSM).Fsm.Event("Msg_Reset");

}

// Funciones de test 

function InitTest () {

}

function ResetShot () {

}

function DoTestShot () {

}

function CheckTestShot () {

}

