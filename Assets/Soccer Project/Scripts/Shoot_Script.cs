
using UnityEngine;
using System.Collections;

public class Shoot_Script : MonoBehaviour {

	public GameObject sphere;

	void Update () {


		// control touch input for mobile device
    	for (int touchIndex = 0; touchIndex<Input.touchCount; touchIndex++){
      		Touch currentTouch = Input.touches[touchIndex];
      		if (currentTouch.phase == TouchPhase.Stationary && GetComponent<GUITexture>().HitTest(currentTouch.position)) {

				sphere.GetComponent<Sphere>().pressiPhoneShootButton = true;
            
       		}
			else
				sphere.GetComponent<Sphere>().pressiPhoneShootButton = false;


			
      		if (currentTouch.phase == TouchPhase.Ended && GetComponent<GUITexture>().HitTest(currentTouch.position)) {
				sphere.GetComponent<Sphere>().pressiPhoneShootButtonEnded = true;
       		}
			else
				sphere.GetComponent<Sphere>().pressiPhoneShootButtonEnded = false;

			
			
    	}
	}
	
}
