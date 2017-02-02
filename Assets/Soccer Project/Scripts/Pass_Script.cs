using UnityEngine;
using System.Collections;

public class Pass_Script : MonoBehaviour {

public GameObject sphere;


	void Update () {


		// control touch input for mobile devices

		for (int touchIndex = 0; touchIndex<Input.touchCount; touchIndex++){
      		Touch currentTouch = Input.touches[touchIndex];
      		if(currentTouch.phase == TouchPhase.Ended && GetComponent<GUITexture>().HitTest(currentTouch.position)){

				sphere.GetComponent<Sphere>().pressiPhonePassButton = true;
            
			} else {
		
				sphere.GetComponent<Sphere>().pressiPhonePassButton = false;
				
				
			}
    	}
	
	}
	
}
