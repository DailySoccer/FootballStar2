using UnityEngine;
using System.Collections;

public class ScoreHUD : MonoBehaviour {

	private InGameState_Script inGame;
	
	// Use this for initialization
	void Start () {
		
		inGame = GameObject.FindObjectOfType( typeof( InGameState_Script ) ) as InGameState_Script;		
		
	}
	
	// Update is called once per frame
	void LateUpdate () {
	
		GetComponentInChildren<GUIText> ().text = inGame.score_local + " - " + inGame.score_visiting;
	}
}
