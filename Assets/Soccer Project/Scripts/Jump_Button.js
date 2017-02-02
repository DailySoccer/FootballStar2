#pragma strict

var player:GameObject;


function Update () {

    for (var touchIndex = 0; touchIndex<Input.touchCount; touchIndex++){
      var currentTouch:Touch = Input.touches[touchIndex];
      if(currentTouch.phase == TouchPhase.Began && GetComponent.<GUITexture>().HitTest(currentTouch.position)){
//        var shot = Instantiate(shot, Vector3 (0, 0, 0), Quaternion.identity);

//		(player.GetComponent( Player_Script ) as Player_Script).pressiPhoneJumpButton = true;
            
       }
    }
}