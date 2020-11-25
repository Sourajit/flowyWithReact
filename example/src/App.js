import React  from 'react'

import {ReactFlowy, deleteBlocks } from 'react-flowy'
import 'react-flowy/dist/index.css'

const App = () => {
        return (
            <div className="app-container">
            <div id="navigation">
            <div id="leftside">
                <div id="details">
                    <div id="back"><img src="assets/arrow.svg" alt="img"/></div>
                    <div id="names">
                        <p id="title">Your automation pipeline</p>
                        <p id="subtitle">Marketing automation</p>
                    </div>
                </div>            
            </div>
            <div id="centerswitch">
                <div id="leftswitch">Diagram view</div>
                <div id="rightswitch">Code editor</div>
            </div>
            <div id="buttonsright">
                { <div id="removeblock" onClick={deleteBlocks}>Delete blocks</div> }
            </div>
        </div>
        <div id="leftcard">
                <div id="closecard">
                    <img src="assets/closeleft.svg" alt="img"/>
                </div>
                <p id="header">Blocks</p>
                <div id="search">
                    <img src="assets/search.svg" alt="img"/>
                    <input type="text" placeholder="Search blocks" />
                </div>
            <div id="blocklist">
                <div className="blockelem create-flowy noselect">
                    <input type="hidden" name='blockelemtype' className="blockelemtype" value="1"/>
                    <div className="grabme">
                        <img src="assets/grabme.svg" alt="img"/>
                    </div>
                    <div className="blockin">
                        <div className="blockico">
                            <span></span>
                            <img src="assets/eye.svg" alt="img"/>
                        </div>
                        <div className="blocktext">
                            <p className="blocktitle">New visitor</p>
                            <p className="blockdesc">Triggers when somebody visits a specified page</p>
                        </div>
                    </div>
                </div>
                <div className="blockelem create-flowy noselect">
                    <input type="hidden" name='blockelemtype' className="blockelemtype" value="2"/>
                    <div className="grabme">
                        <img src="assets/grabme.svg" alt="img"/>
                    </div>
                    <div className="blockin">
                        <div className="blockico">
                            <span></span>
                            <img src="assets/action.svg" alt="img"/>
                        </div>
                        <div className="blocktext">
                            <p className="blocktitle">Action is performed</p>
                            <p className="blockdesc">Triggers when somebody performs a specified action</p>
                        </div>
                    </div>
                </div>
                <div className="blockelem create-flowy noselect">
                    <input type="hidden" name='blockelemtype' className="blockelemtype" value="3"/>
                    <div className="grabme">
                        <img src="assets/grabme.svg" alt="img"/>
                    </div>
                    <div className="blockin">
                        <div className="blockico">
                            <span></span>
                            <img src="assets/time.svg" alt="img"/>
                        </div>
                        <div className="blocktext">
                            <p className="blocktitle">Time has passed</p>
                            <p className="blockdesc">Triggers after a specified amount of time</p>
                        </div>
                    </div>
                </div>
                <div className="blockelem create-flowy noselect">
                    <input type="hidden" name='blockelemtype' className="blockelemtype" value="4"/>
                    <div className="grabme">
                        <img src="assets/grabme.svg" alt="img"/>
                    </div>
                    <div className="blockin">
                        <div className="blockico">
                            <span></span>
                            <img src="assets/error.svg" alt="img"/>
                        </div>
                        <div className="blocktext">
                            <p className="blocktitle">Error prompt</p>
                            <p className="blockdesc">Triggers when a specified error happens</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <ReactFlowy id="reactFlowyCanvas" drag = {(block) =>{console.log("Dragging")}} release = {() =>{console.log("Release")}} 
        snapping = {(drag, first) => {console.log("Snapping"); return true;}} />
        </div>
        );
      }

export default App;