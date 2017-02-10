#pragma strict

var Ball : GameObject;
var PhysicBall : GameObject;
var PlayerTeam : GameObject;

private var ZonesLimits = [-55.0,15.0,25.0,55.0];

//*
private var Heights = [18.0,18.0,18.0,18.0];
private var Zooms = [22.0,22.0,22.0,22.0];
/*/
private var Heights = [3.0,3.0,3.0,3.0];
private var Zooms = [10.0,10.0,10.0,10.0];
/**/

private var AttackZoneZ = 15; // Coordenada Z donde se considera que comienza la zona de ataque 

// Valores que 
private var TargetPosition : Vector3;
private var TargetLookAt : Vector3;

private var Pitch : GameObject;

function Start () {

	Pitch = GameObject.Find("Pitch");
	TargetLookAt = PhysicBall.transform.position;

}

function Update () {


}

function UpdateNeutral () {

	// Actualizamos el punto de target

	var tX : float = PhysicBall.transform.position.x+50;
	if (tX > 90)
		tX = 90;
	var tTargetPosition : Vector3 = Vector3(tX, GetHeight()*1.6, PhysicBall.transform.position.z);
	var tTargetLookAt : Vector3 = PhysicBall.transform.position;
	tTargetLookAt = TargetLookAt + ((PhysicBall.transform.position-TargetLookAt)/15);
	
	TargetLookAt = tTargetLookAt;
	
	gameObject.transform.position = gameObject.transform.position + ((tTargetPosition-gameObject.transform.position)/15);
	gameObject.transform.LookAt(TargetLookAt); //Vector3(gameObject.transform.position.x,TargetLookAt.y,TargetLookAt.z));
	gameObject.GetComponent.<Camera>().fieldOfView = GetZoom();
	
	// Cambiamos de estado?
	if ( PlayerTeam.GetComponent(PlayMakerFSM).ActiveStateName == "Attacking" ) {
		// Transicionamos a Attacking
		gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Attacking");
	}

}

function UpdateAttacking () {

	//var tTargetPosition : Vector3 = Vector3(PhysicBall.transform.position.x+50, GetHeight()*1.6, PhysicBall.transform.position.z);
	
	// LÍMITES DEL CAMPO
	
	/*
	if (tTargetPosition.x < -25) {
		tTargetPosition.x = -25;
	} else if (tTargetPosition.x > 25) {
		tTargetPosition.x = 25;
	}
	*/

	// CÁMARA LATERAL
	
	var tX : float = PhysicBall.transform.position.x+50;
	if (tX > 90)
		tX = 90;
	var tTargetPosition : Vector3 = Vector3(tX, GetHeight()*1.6, PhysicBall.transform.position.z);
	var tTargetLookAt : Vector3; // = PhysicBall.transform.position;
	var tPercent : float;
	
	if (PhysicBall.transform.position.z > AttackZoneZ) {
		tPercent =  (PhysicBall.transform.position.z-AttackZoneZ) / ((Pitch.GetComponent(SoccerPitch).PitchLength/2) - AttackZoneZ) ;
		tTargetLookAt = PhysicBall.transform.position+((Vector3(0,0,Pitch.GetComponent(SoccerPitch).PitchLength/2)-PhysicBall.transform.position)*0.7*tPercent);
		tTargetLookAt = TargetLookAt + ((tTargetLookAt-TargetLookAt)/15);
	} else {
		tTargetLookAt = TargetLookAt + ((PhysicBall.transform.position-TargetLookAt)/15);
	}
	
	TargetLookAt = tTargetLookAt;
	
	gameObject.transform.position = gameObject.transform.position + ((tTargetPosition-gameObject.transform.position)/15);
	gameObject.transform.LookAt(TargetLookAt); //Vector3(gameObject.transform.position.x,TargetLookAt.y,TargetLookAt.z));
	gameObject.GetComponent.<Camera>().fieldOfView = GetZoom();
	
	// Cambiamos de estado?
	
	if ( PlayerTeam.GetComponent(PlayMakerFSM).ActiveStateName == "Defending" ) {
		// Transicionamos a Neutral
		gameObject.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Neutral");
	}

}

function GetCameraZ () {


}

function GetCameraLookAt () {

	/*
	var tTargetLookAtZ : float;

	if (tTargetLookAt.z > AttackZoneZ) {
		tTargetLookAtZ = TargetLookAt + ((PhysicBall.transform.position-TargetLookAt)/15);
	} else if (tTargetLookAt.z < -AttackZoneZ) {
		tTargetLookAt = TargetLookAt + ((PhysicBall.transform.position-TargetLookAt)/15);
	} else {
		tTargetLookAt = TargetLookAt + ((PhysicBall.transform.position-TargetLookAt)/15);
	}
	*/

}

function GetZoom () {

	var coordZ : float = Ball.transform.position.z; 
	var zoom : float;

	// Si entramos en la zona de cámara de ataque se comporta distinta

	if (coordZ < ZonesLimits[0])
		zoom = Zooms[0];
	else if (coordZ > ZonesLimits[ZonesLimits.length-1])
		zoom = Zooms[ZonesLimits.length-1];
	else
		for ( var i : int = 0; i < ZonesLimits.length-1; i++ ) {
			if ( coordZ >= ZonesLimits[i] && coordZ < ZonesLimits[i+1] ) {
				zoom = ( (Zooms[i+1]-Zooms[i])/(ZonesLimits[i+1]-ZonesLimits[i]) * (coordZ-ZonesLimits[i]) ) + Zooms[i];
				break;
			}
		}
	
	return zoom;

} 

function GetHeight () {

	var coordZ : float = Ball.transform.position.z; 
	var height : float;

	if (coordZ < ZonesLimits[0])
		height = Heights[0];
	else if (coordZ > ZonesLimits[ZonesLimits.length-1])
		height = Heights[ZonesLimits.length-1];
	else
		for ( var i : int = 0; i < ZonesLimits.length-1; i++ ) {
			if ( coordZ >= ZonesLimits[i] && coordZ < ZonesLimits[i+1] ) {
				height = Heights[i];
				//height = ( (Heights[i+1]-Heights[i])/(ZonesLimits[i+1]-ZonesLimits[i]) * (coordZ-ZonesLimits[i]) ) + Heights[i];
				break;
			}
		}
	
	return height;

} 