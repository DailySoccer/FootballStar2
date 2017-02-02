#pragma strict

var Team : GameObject;
var TeamOpponent : GameObject;
var PhysicBall : GameObject;
var minSwipeLength : float = 100;

private var MouseDownCoordinates : Vector3;
private var MouseUpCoordinates : Vector3;
private var SwipeStartCoordinates : Vector3;
private var CrossingPoint1 : Vector3;
private var CrossingPoint2 : Vector3;

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
@System.NonSerialized
var Dificulty : int = 0; // 0-fácil, 1-medio, 2-difícil, 3-muy difícil

// Use this for initialization
function Start () {

}

// Update is called once per frame
function Update () {

}

function SetMouseDownCoordinates (tMouseX : float, tMouseY : float) {

	MouseDownCoordinates = Vector3(tMouseX, tMouseY, 0);
	
	if (GetInteractivePlayer() != null) {
		SwipeStartCoordinates = Camera.main.WorldToScreenPoint(GetInteractivePlayer().transform.position);
	} else {
		SwipeStartCoordinates = Vector3(Screen.width/2, Screen.height/2, 0);
	}
	
	//var screenCenter : Vector3 = Vector3(Screen.width/2, Screen.height/2, 0);
	
	//Vector3 screenPos = Camera.main.WorldToScreenPoint(target.position);
	
	//var translatedSwipe : Vector3 = (MouseUpCoordinates-MouseDownCoordinates);
	
	var shotVector : Vector3;
	
	var fieldPlane : Plane = Plane ( Vector3(0,1,0), Vector3(0,0,0) );
	var ray1 : Ray = Camera.main.ScreenPointToRay (SwipeStartCoordinates);
	var rayDistance1 : float;
	
	if (fieldPlane.Raycast(ray1, rayDistance1))
			CrossingPoint1 = ray1.GetPoint(rayDistance1);

}

function SetMouseUpCoordinates (tMouseX : float, tMouseY : float) {

	MouseUpCoordinates = Vector3(tMouseX, tMouseY, 0);
	
	//var screenCenter : Vector3 = Vector3(Screen.width/2, Screen.height/2, 0);
	var translatedSwipe : Vector3 = (MouseUpCoordinates-MouseDownCoordinates);
	
	var shotVector : Vector3;
	
	var fieldPlane : Plane = Plane ( Vector3(0,1,0), Vector3(0,0,0) );
	
	var ray1 : Ray = Camera.main.ScreenPointToRay (SwipeStartCoordinates);
	var rayDistance1 : float;	
	var ray2 : Ray = Camera.main.ScreenPointToRay (SwipeStartCoordinates+translatedSwipe);
	var rayDistance2 : float;
	
	if (fieldPlane.Raycast(ray1, rayDistance1))
			CrossingPoint1 = ray1.GetPoint(rayDistance1);
	
	if (fieldPlane.Raycast(ray2, rayDistance2))
			CrossingPoint2 = ray2.GetPoint(rayDistance2);

}

function CalculateSwipe ( swipeTime : float) {
	
	/*
	var screenCenter : Vector3 = Vector3(Screen.width/2, Screen.height/2, 0);
	var translatedSwipe : Vector3 = (MouseUpCoordinates-MouseDownCoordinates);
	
	var shotVector : Vector3;
	
	var fieldPlane : Plane = Plane ( Vector3(0,1,0), Vector3(0,0,0) );
	var ray1 : Ray = Camera.main.ScreenPointToRay (screenCenter);
	var ray2 : Ray = Camera.main.ScreenPointToRay (screenCenter+translatedSwipe);
	var rayDistance1 : float;
	var rayDistance2 : float;
	var crossingPoint1 : Vector3;
	var crossingPoint2 : Vector3;
	
	if (fieldPlane.Raycast(ray1, rayDistance1))
			crossingPoint1 = ray1.GetPoint(rayDistance1);
	
	if (fieldPlane.Raycast(ray2, rayDistance2))
			crossingPoint2 = ray2.GetPoint(rayDistance2);	
	*/
	
	var shotVector : Vector3;
	shotVector = CrossingPoint2-CrossingPoint1;
	
	// Devolvemos un vector con la dirección del tiro y la longitud numéricamente coincidente con la longitud del swipe en pixels

	if ( CrossingPoint1 != null && CrossingPoint2 != null ) {
		
		var shotMagnitude : float = Vector3.Distance(MouseDownCoordinates, MouseUpCoordinates);
		if ( shotMagnitude > minSwipeLength ) {
			shotVector = shotVector.normalized * shotMagnitude;
			return ( shotVector );
		}
		
	}
		
	return Vector3(0,0,0); // Si devolvemos esto, no habrá tiro (hacemos la comprobación en la FSM)

}

function GetInteractivePlayer () {

	for (var i : int = 1; i < Team.GetComponent(SoccerTeam).PlayersList.length; i++) {
		if ( Team.GetComponent(SoccerTeam).PlayersList[i].GetComponent(FieldPlayer).Interactive ) {
			return Team.GetComponent(SoccerTeam).PlayersList[i];
		}
	}
	
	return null;

}

function Reset () {

	Dificulty = (Random.value < 0.5) ? 0 : 3;
	Debug.Log("DIFICULTY: " + Dificulty);

	PhysicBall.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Init");
	Team.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Init");
	TeamOpponent.GetComponent(PlayMakerFSM).Fsm.Event("Msg_Init");

}