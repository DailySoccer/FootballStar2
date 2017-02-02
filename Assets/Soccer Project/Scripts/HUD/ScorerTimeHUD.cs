using UnityEngine;
using System.Collections;

public class ScorerTimeHUD : MonoBehaviour {
	
	public float timeMatch = 0.0f;
	public int minutes = 0;
	public int seconds = 0;
	public float TRANSFORM_TIME = 1.0f;
	private InGameState_Script inGame;
	
	// Use this for initialization
	void Start () {
	
		inGame = GameObject.FindObjectOfType( typeof( InGameState_Script ) ) as InGameState_Script;		
		
	}
	
	// Update is called once per frame
	void Update ()
	{
		if (inGame.state == InGameState_Script.InGameState.PLAYING) {	
			timeMatch += Time.deltaTime * TRANSFORM_TIME;
		}		

		int d = (int)(timeMatch * 100.0f);
		minutes = d / (60 * 100);
		seconds = (d % (60 * 100)) / 100;
				
		string time = string.Format ("{0:00}:{1:00}", minutes, seconds);
		GetComponentInChildren<GUIText> ().text = time;
	
	}
}
