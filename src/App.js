import React, { useEffect } from 'react'
import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { Provider } from 'react-redux'
import reducer from './reducers'
import rootSaga from './sagas'

const sagaMiddleware = createSagaMiddleware()
const store = createStore(reducer, applyMiddleware(sagaMiddleware))
sagaMiddleware.run(rootSaga)

const action = (type,payload,key) => store.dispatch({ type , payload,key})

console.log("Initial State",store.getState());

var blocks = [];
var blockstemp = [];
var canvas_div;
var drag, original;
var el = document.createElement("DIV");

store.subscribe(()=>{
  console.log("Updated State",store.getState());
})

//props
var grab;
var release;
var snapping;
var rearrange = function() {
  return false;
};
var paddingx;
var paddingy;

export const load = (props) => {
    if (!store.getState().loaded)
      action("UPDATE",true,"loaded");
    else
        return;
    canvas_div = (props.id)?document.getElementById(props.id):document.getElementById("canvas");
    grab = props.drag || ((block) => {});
    release = props.release || (() => {});
    snapping = props.snapping || ((drag, first) => true);
    paddingx = props.spacing_x || 20;
    paddingy = props.spacing_y || 80;
    rearrange = props.rearrange || false;
    if (window.getComputedStyle(canvas_div).position == "absolute" || window.getComputedStyle(canvas_div).position == "fixed") {    
      action("UPDATE",canvas_div.getBoundingClientRect().left,"absx");
      action("UPDATE",canvas_div.getBoundingClientRect().top,"absy")
    }
    el.classList.add('indicator');
    el.classList.add('invisible');
    canvas_div.appendChild(el);
}
export const _import = function(output) {
    canvas_div.innerHTML = output.html;
    for (var a = 0; a < output.blockarr.length; a++) {
        blocks.push({
            childwidth: parseFloat(output.blockarr[a].childwidth),
            parent: parseFloat(output.blockarr[a].parent),
            id: parseFloat(output.blockarr[a].id),
            x: parseFloat(output.blockarr[a].x),
            y: parseFloat(output.blockarr[a].y),
            width: parseFloat(output.blockarr[a].width),
            height: parseFloat(output.blockarr[a].height)
        })
    }
    if (blocks.length > 1) {
        rearrangeMe();
        checkOffset();
    }
  }
  export const output = function() {
    var html_ser = canvas_div.innerHTML;
    var json_data = {
        html: html_ser,
        blockarr: blocks,
        blocks: []
    };
    if (blocks.length > 0) {
        for (var i = 0; i < blocks.length; i++) {
            json_data.blocks.push({
                id: blocks[i].id,
                parent: blocks[i].parent,
                data: [],
                attr: []
            });
            var blockParent = document.querySelector(".blockid[value='" + blocks[i].id + "']").parentNode;
            blockParent.querySelectorAll("input").forEach(function(block) {
                var json_name = block.getAttribute("name");
                var json_value = block.value;
                json_data.blocks[i].data.push({
                    name: json_name,
                    value: json_value
                });
            });
            Array.prototype.slice.call(blockParent.attributes).forEach(function(attribute) {
                var jsonobj = {};
                jsonobj[attribute.name] = attribute.value;
                json_data.blocks[i].attr.push(jsonobj);
            });
        }
        return json_data;
    }
  }
  export const deleteBlocks = function(){
    blocks = [];
    canvas_div.innerHTML = "<div class='indicator invisible'></div>";
  }
  export const beginDrag = function(event) {
    var mouse_x, mouse_y;
    if (window.getComputedStyle(canvas_div).position == "absolute" || window.getComputedStyle(canvas_div).position == "fixed") {      
        action("UPDATE",canvas_div.getBoundingClientRect().left,"absx");
        action("UPDATE",canvas_div.getBoundingClientRect().top,"absy");
    }
    if (event.targetTouches) {
        mouse_x = event.changedTouches[0].clientX;
        mouse_y = event.changedTouches[0].clientY;
    } else {
        mouse_x = event.clientX;
        mouse_y = event.clientY;
    }
    if (event.which != 3 && event.target.closest(".create-flowy")) {
        original = event.target.closest(".create-flowy");
        var newNode = event.target.closest(".create-flowy").cloneNode(true);
        event.target.closest(".create-flowy").classList.add("dragnow");
        newNode.classList.add("block");
        newNode.classList.remove("create-flowy");
        if (blocks.length === 0) {
            newNode.innerHTML += "<input type='hidden' name='blockid' class='blockid' value='" + blocks.length + "'>";
            document.body.appendChild(newNode);
            drag = document.querySelector(".blockid[value='" + blocks.length + "']").parentNode;
        } else {
            newNode.innerHTML += "<input type='hidden' name='blockid' class='blockid' value='" + (Math.max.apply(Math, blocks.map(a => a.id)) + 1) + "'>";
            document.body.appendChild(newNode);
            drag = document.querySelector(".blockid[value='" + (parseInt(Math.max.apply(Math, blocks.map(a => a.id))) + 1) + "']").parentNode;
        }
        blockGrabbed(event.target.closest(".create-flowy"));
        drag.classList.add("dragging");
        action("UPDATE",true,"active");
        action("UPDATE",mouse_x -  (event.target.closest(".create-flowy").getBoundingClientRect().left),"dragx");
        action("UPDATE",mouse_y -  (event.target.closest(".create-flowy").getBoundingClientRect().top),"dragy");
        drag.style.left = mouse_x - store.getState().dragx + "px";
        drag.style.top = mouse_y - store.getState().dragy + "px";
    }
  }
  export const endDrag = function(event) {
    if (event.which != 3 && (store.getState().active || rearrange)) {
        action("UPDATE",false,"dragblock");
        blockReleased();
        if (!document.querySelector(".indicator").classList.contains("invisible")) {
            document.querySelector(".indicator").classList.add("invisible");
        }
        if (store.getState().active) {
            original.classList.remove("dragnow");
            drag.classList.remove("dragging");
        }
        if (parseInt(drag.querySelector(".blockid").value) === 0 && rearrange) {
            firstBlock("rearrange")    
        } else if (store.getState().active && blocks.length == 0 && (drag.getBoundingClientRect().top + window.scrollY) > (canvas_div.getBoundingClientRect().top + window.scrollY) && (drag.getBoundingClientRect().left + window.scrollX) > (canvas_div.getBoundingClientRect().left + window.scrollX)) {
            firstBlock("drop");
        } else if (store.getState().active && blocks.length == 0) {
            removeSelection();
        } else if (store.getState().active) {
            var blocko = blocks.map(a => a.id);
            for (var i = 0; i < blocks.length; i++) {
                if (checkAttach(blocko[i])) {
                    action("UPDATE",false,"active");
                    if (blockSnap(drag, false, document.querySelector(".blockid[value='" + blocko[i] + "']").parentNode)) {
                        snap(drag, i, blocko);
                    } else {
                        action("UPDATE",false,"active");
                        removeSelection();
                    }
                    break;
                } else if (i == blocks.length - 1) {
                    action("UPDATE",false,"active");
                    removeSelection();
                }
            }
        } else if (rearrange) {
            var blocko = blocks.map(a => a.id);
            for (var i = 0; i < blocks.length; i++) {
                if (checkAttach(blocko[i])) {
                    action("UPDATE",false,"active");
                    drag.classList.remove("dragging");
                    snap(drag, i, blocko);
                    break;
                } else if (i == blocks.length - 1) {
                    if (beforeDelete(drag, blocks.filter(id => id.id == blocko[i])[0])) {
                        action("UPDATE",false,"active");
                        drag.classList.remove("dragging");
                        snap(drag, blocko.indexOf(store.getState().prevblock), blocko);
                        break;
                    } else {
                        rearrange = false;
                        blockstemp = [];
                        action("UPDATE",false,"active");
                        removeSelection();
                        break;
                    }
                }
            }
        }
    }
  }

  function checkAttach(id) {
    const xpos = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + canvas_div.scrollLeft - canvas_div.getBoundingClientRect().left;
    const ypos = (drag.getBoundingClientRect().top + window.scrollY) + canvas_div.scrollTop - canvas_div.getBoundingClientRect().top;
    if (xpos >= blocks.filter(a => a.id == id)[0].x - (blocks.filter(a => a.id == id)[0].width / 2) - paddingx && xpos <= blocks.filter(a => a.id == id)[0].x + (blocks.filter(a => a.id == id)[0].width / 2) + paddingx && ypos >= blocks.filter(a => a.id == id)[0].y - (blocks.filter(a => a.id == id)[0].height / 2) && ypos <= blocks.filter(a => a.id == id)[0].y + blocks.filter(a => a.id == id)[0].height) {
        return true;   
    } else {
        return false;
    }
  }

  function removeSelection() {
    canvas_div.appendChild(document.querySelector(".indicator"));
    drag.parentNode.removeChild(drag);
  }

  function firstBlock(type) {
    if (type == "drop") {
        blockSnap(drag, true, undefined);
        action("UPDATE",false,"active");
        drag.style.top = (drag.getBoundingClientRect().top + window.scrollY) - (store.getState().absy + window.scrollY) + canvas_div.scrollTop + "px";
        drag.style.left = (drag.getBoundingClientRect().left + window.scrollX) - (store.getState().absx + window.scrollX) + canvas_div.scrollLeft + "px";
        canvas_div.appendChild(drag);
        blocks.push({
            parent: -1,
            childwidth: 0,
            id: parseInt(drag.querySelector(".blockid").value),
            x: (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + canvas_div.scrollLeft - canvas_div.getBoundingClientRect().left,
            y: (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height) / 2) + canvas_div.scrollTop - canvas_div.getBoundingClientRect().top,
            width: parseInt(window.getComputedStyle(drag).width),
            height: parseInt(window.getComputedStyle(drag).height)
        });
    } else if (type == "rearrange") {
        drag.classList.remove("dragging");
        rearrange = false;
        for (var w = 0; w < blockstemp.length; w++) {
            if (blockstemp[w].id != parseInt(drag.querySelector(".blockid").value)) {
                const blockParent = document.querySelector(".blockid[value='" + blockstemp[w].id + "']").parentNode;
                const arrowParent = document.querySelector(".arrowid[value='" + blockstemp[w].id + "']").parentNode;
                blockParent.style.left = (blockParent.getBoundingClientRect().left + window.scrollX) - (window.scrollX) + canvas_div.scrollLeft - 1 - store.getState().absx + "px";
                blockParent.style.top = (blockParent.getBoundingClientRect().top + window.scrollY) - (window.scrollY) + canvas_div.scrollTop - store.getState().absy - 1 + "px";
                arrowParent.style.left = (arrowParent.getBoundingClientRect().left + window.scrollX) - (window.scrollX) + canvas_div.scrollLeft - store.getState().absx - 1 + "px";
                arrowParent.style.top = (arrowParent.getBoundingClientRect().top + window.scrollY) + canvas_div.scrollTop - 1 - store.getState().absy + "px";
                canvas_div.appendChild(blockParent);
                canvas_div.appendChild(arrowParent);
                blockstemp[w].x = (blockParent.getBoundingClientRect().left + window.scrollX) + (parseInt(blockParent.offsetWidth) / 2) + canvas_div.scrollLeft - canvas_div.getBoundingClientRect().left - 1;
                blockstemp[w].y = (blockParent.getBoundingClientRect().top + window.scrollY) + (parseInt(blockParent.offsetHeight) / 2) + canvas_div.scrollTop - canvas_div.getBoundingClientRect().top - 1;
            }
        }
        blockstemp.filter(a => a.id == 0)[0].x = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + canvas_div.scrollLeft - canvas_div.getBoundingClientRect().left;
        blockstemp.filter(a => a.id == 0)[0].y = (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height) / 2) + canvas_div.scrollTop - canvas_div.getBoundingClientRect().top;
        blocks = blocks.concat(blockstemp);
        blockstemp = [];
    }
  }

  function drawArrow(arrow, x, y, id) {
    if (x < 0) {
        canvas_div.innerHTML += '<div class="arrowblock"><input type="hidden" class="arrowid" value="' + drag.querySelector(".blockid").value + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M' + (blocks.filter(a => a.id == id)[0].x - arrow.x + 5) + ' 0L' + (blocks.filter(a => a.id == id)[0].x - arrow.x + 5) + ' ' + (paddingy / 2) + 'L5 ' + (paddingy / 2) + 'L5 ' + y + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M0 ' + (y - 5) + 'H10L5 ' + y + 'L0 ' + (y - 5) + 'Z" fill="#C5CCD0"/></svg></div>';
        document.querySelector('.arrowid[value="' + drag.querySelector(".blockid").value + '"]').parentNode.style.left = (arrow.x - 5) - (store.getState().absx + window.scrollX) + canvas_div.scrollLeft + canvas_div.getBoundingClientRect().left + "px";
    } else {
        canvas_div.innerHTML += '<div class="arrowblock"><input type="hidden" class="arrowid" value="' + drag.querySelector(".blockid").value + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0L20 ' + (paddingy / 2) + 'L' + (x) + ' ' + (paddingy / 2) + 'L' + x + ' ' + y + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M' + (x - 5) + ' ' + (y - 5) + 'H' + (x + 5) + 'L' + x + ' ' + y + 'L' + (x - 5) + ' ' + (y - 5) + 'Z" fill="#C5CCD0"/></svg></div>';
        document.querySelector('.arrowid[value="' + parseInt(drag.querySelector(".blockid").value) + '"]').parentNode.style.left = blocks.filter(a => a.id == id)[0].x - 20 - (store.getState().absx  + window.scrollX) + canvas_div.scrollLeft + canvas_div.getBoundingClientRect().left + "px";
    }
    document.querySelector('.arrowid[value="' + parseInt(drag.querySelector(".blockid").value) + '"]').parentNode.style.top = blocks.filter(a => a.id == id)[0].y + (blocks.filter(a => a.id == id)[0].height / 2) + canvas_div.getBoundingClientRect().top - store.getState().absy + "px";
  }

  function updateArrow(arrow, x, y, children) { 
    if (x < 0) {
        document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.style.left = (arrow.x - 5) - (store.getState().absx + window.scrollX) + canvas_div.getBoundingClientRect().left + "px";
        document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.innerHTML = '<input type="hidden" class="arrowid" value="' + children.id + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M' + (blocks.filter(id => id.id == children.parent)[0].x - arrow.x + 5) + ' 0L' + (blocks.filter(id => id.id == children.parent)[0].x - arrow.x + 5) + ' ' + (paddingy / 2) + 'L5 ' + (paddingy / 2) + 'L5 ' + y + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M0 ' + (y - 5) + 'H10L5 ' + y + 'L0 ' + (y - 5) + 'Z" fill="#C5CCD0"/></svg>';
    } else {
        document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.style.left = blocks.filter(id => id.id == children.parent)[0].x - 20 - (store.getState().absx + window.scrollX) + canvas_div.getBoundingClientRect().left + "px";
        document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.innerHTML = '<input type="hidden" class="arrowid" value="' + children.id + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0L20 ' + (paddingy / 2) + 'L' + (x) + ' ' + (paddingy / 2) + 'L' + x + ' ' + y + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M' + (x - 5) + ' ' + (y - 5) + 'H' + (x + 5) + 'L' + x + ' ' + y + 'L' + (x - 5) + ' ' + (y - 5) + 'Z" fill="#C5CCD0"/></svg>';
    }
  }

  function snap(drag, i, blocko) {
    if (!rearrange) {
        canvas_div.appendChild(drag);
    }
    var totalwidth = 0;
    var totalremove = 0;
    var maxheight = 0;
    for (var w = 0; w < blocks.filter(id => id.parent == blocko[i]).length; w++) {
        var children = blocks.filter(id => id.parent == blocko[i])[w];
        if (children.childwidth > children.width) {
            totalwidth += children.childwidth + paddingx;
        } else {
            totalwidth += children.width + paddingx;
        }
    }
    totalwidth += parseInt(window.getComputedStyle(drag).width);
    for (var w = 0; w < blocks.filter(id => id.parent == blocko[i]).length; w++) {
        var children = blocks.filter(id => id.parent == blocko[i])[w];
        if (children.childwidth > children.width) {
            document.querySelector(".blockid[value='" + children.id + "']").parentNode.style.left = blocks.filter(a => a.id == blocko[i])[0].x - (totalwidth / 2) + totalremove + (children.childwidth / 2) - (children.width / 2) + "px";
            children.x = blocks.filter(id => id.parent == blocko[i])[0].x - (totalwidth / 2) + totalremove + (children.childwidth / 2);
            totalremove += children.childwidth + paddingx;
        } else {
            document.querySelector(".blockid[value='" + children.id + "']").parentNode.style.left = blocks.filter(a => a.id == blocko[i])[0].x - (totalwidth / 2) + totalremove + "px";
            children.x = blocks.filter(id => id.parent == blocko[i])[0].x - (totalwidth / 2) + totalremove + (children.width / 2);
            totalremove += children.width + paddingx;
        }
    }
    drag.style.left = blocks.filter(id => id.id == blocko[i])[0].x - (totalwidth / 2) + totalremove - (window.scrollX + store.getState().absx) + canvas_div.scrollLeft + canvas_div.getBoundingClientRect().left + "px";
    drag.style.top = blocks.filter(id => id.id == blocko[i])[0].y + (blocks.filter(id => id.id == blocko[i])[0].height / 2) + paddingy - (window.scrollY + store.getState().absy) + canvas_div.getBoundingClientRect().top + "px";
    if (rearrange) {
        blockstemp.filter(a => a.id == parseInt(drag.querySelector(".blockid").value))[0].x = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + canvas_div.scrollLeft - canvas_div.getBoundingClientRect().left;
        blockstemp.filter(a => a.id == parseInt(drag.querySelector(".blockid").value))[0].y = (drag.getBoundingClientRect().top + window.scrollY + store.getState().absy) + (parseInt(window.getComputedStyle(drag).height) / 2) + canvas_div.scrollTop - canvas_div.getBoundingClientRect().top;
        blockstemp.filter(a => a.id == drag.querySelector(".blockid").value)[0].parent = blocko[i];
        for (var w = 0; w < blockstemp.length; w++) {
            if (blockstemp[w].id != parseInt(drag.querySelector(".blockid").value)) {
                const blockParent = document.querySelector(".blockid[value='" + blockstemp[w].id + "']").parentNode;
                const arrowParent = document.querySelector(".arrowid[value='" + blockstemp[w].id + "']").parentNode;
                blockParent.style.left = (blockParent.getBoundingClientRect().left + window.scrollX) - (window.scrollX + canvas_div.getBoundingClientRect().left) + canvas_div.scrollLeft + "px";
                blockParent.style.top = (blockParent.getBoundingClientRect().top + window.scrollY) - (window.scrollY + canvas_div.getBoundingClientRect().top) + canvas_div.scrollTop + "px";
                arrowParent.style.left = (arrowParent.getBoundingClientRect().left + window.scrollX) - (window.scrollX + canvas_div.getBoundingClientRect().left) + canvas_div.scrollLeft + 20 + "px";
                arrowParent.style.top = (arrowParent.getBoundingClientRect().top + window.scrollY) - (window.scrollY + canvas_div.getBoundingClientRect().top) + canvas_div.scrollTop + "px";
                canvas_div.appendChild(blockParent);
                canvas_div.appendChild(arrowParent);

                blockstemp[w].x = (blockParent.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(blockParent).width) / 2) + canvas_div.scrollLeft - canvas_div.getBoundingClientRect().left;
                blockstemp[w].y = (blockParent.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(blockParent).height) / 2) + canvas_div.scrollTop - canvas_div.getBoundingClientRect().top;
            }
        }
        blocks = blocks.concat(blockstemp);
        blockstemp = [];
    } else {
        blocks.push({
            childwidth: 0,
            parent: blocko[i],
            id: parseInt(drag.querySelector(".blockid").value),
            x: (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + canvas_div.scrollLeft - canvas_div.getBoundingClientRect().left,
            y: (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height) / 2) + canvas_div.scrollTop - canvas_div.getBoundingClientRect().top,
            width: parseInt(window.getComputedStyle(drag).width),
            height: parseInt(window.getComputedStyle(drag).height)
        });
    }
    
    var arrowblock = blocks.filter(a => a.id == parseInt(drag.querySelector(".blockid").value))[0];
    var arrowx = arrowblock.x - blocks.filter(a => a.id == blocko[i])[0].x + 20;
    var arrowy = paddingy;
    drawArrow(arrowblock, arrowx, arrowy, blocko[i]);
    
    if (blocks.filter(a => a.id == blocko[i])[0].parent != -1) {
        var flag = false;
        var idval = blocko[i];
        while (!flag) {
            if (blocks.filter(a => a.id == idval)[0].parent == -1) {
                flag = true;
            } else {
                var zwidth = 0;
                for (var w = 0; w < blocks.filter(id => id.parent == idval).length; w++) {
                    var children = blocks.filter(id => id.parent == idval)[w];
                    if (children.childwidth > children.width) {
                        if (w == blocks.filter(id => id.parent == idval).length - 1) {
                            zwidth += children.childwidth;
                        } else {
                            zwidth += children.childwidth + paddingx;
                        }
                    } else {
                        if (w == blocks.filter(id => id.parent == idval).length - 1) {
                            zwidth += children.width;
                        } else {
                            zwidth += children.width + paddingx;
                        }
                    }
                }
                blocks.filter(a => a.id == idval)[0].childwidth = zwidth;
                idval = blocks.filter(a => a.id == idval)[0].parent;
            }
        }
        blocks.filter(id => id.id == idval)[0].childwidth = totalwidth;
    }
    if (rearrange) {
        rearrange = false;
        drag.classList.remove("dragging");
    }
    rearrangeMe();
    checkOffset();
  }

  function touchblock(event) {
    action("UPDATE",false,"dragblock");
    var mouse_x, mouse_y;
    if (hasParentClass(event.target, "block")) {
        var theblock = event.target.closest(".block");
        if (event.targetTouches) {
            mouse_x = event.targetTouches[0].clientX;
            mouse_y = event.targetTouches[0].clientY;
        } else {
            mouse_x = event.clientX;
            mouse_y = event.clientY;
        }
        if (event.type !== "mouseup" && hasParentClass(event.target, "block")) {
            if (event.which != 3) {
                if (!store.getState().active && !rearrange) {
                    action("UPDATE",true,"dragblock");
                    drag = theblock;
                    action("UPDATE",mouse_x - (drag.getBoundingClientRect().left + window.scrollX),"dragx");
                    action("UPDATE",mouse_y - (drag.getBoundingClientRect().top + window.scrollY),"dragy");
                }
            }
        }
    }
  }

  function hasParentClass(element, classname) {
    if (element.className) {
        if (element.className.split(' ').indexOf(classname) >= 0) return true;
    }
    return element.parentNode && hasParentClass(element.parentNode, classname);
  }

  export const moveBlock = function(event) {
    var mouse_x, mouse_y;
    if (event.targetTouches) {
        mouse_x = event.targetTouches[0].clientX;
        mouse_y = event.targetTouches[0].clientY;
    } else {
        mouse_x = event.clientX;
        mouse_y = event.clientY;
    }
    if (store.getState().dragblock) {
        rearrange = true;
        drag.classList.add("dragging");
        var blockid = parseInt(drag.querySelector(".blockid").value);
        action("UPDATE",blocks.filter(a => a.id == blockid)[0].parent,"prevblock" );
        blockstemp.push(blocks.filter(a => a.id == blockid)[0]);
        blocks = blocks.filter(function(e) {
            return e.id != blockid
        });
        if (blockid != 0) {
            document.querySelector(".arrowid[value='" + blockid + "']").parentNode.remove();
        }
        var layer = blocks.filter(a => a.parent == blockid);
        var flag = false;
        var foundids = [];
        var allids = [];
        while (!flag) {
            for (var i = 0; i < layer.length; i++) {
                if (layer[i] != blockid) {
                    blockstemp.push(blocks.filter(a => a.id == layer[i].id)[0]);
                    const blockParent = document.querySelector(".blockid[value='" + layer[i].id + "']").parentNode;
                    const arrowParent = document.querySelector(".arrowid[value='" + layer[i].id + "']").parentNode;
                    blockParent.style.left = (blockParent.getBoundingClientRect().left + window.scrollX) - (drag.getBoundingClientRect().left + window.scrollX) + "px";
                    blockParent.style.top = (blockParent.getBoundingClientRect().top + window.scrollY) - (drag.getBoundingClientRect().top + window.scrollY) + "px";
                    arrowParent.style.left = (arrowParent.getBoundingClientRect().left + window.scrollX) - (drag.getBoundingClientRect().left + window.scrollX) + "px";
                    arrowParent.style.top = (arrowParent.getBoundingClientRect().top + window.scrollY) - (drag.getBoundingClientRect().top + window.scrollY) + "px";
                    drag.appendChild(blockParent);
                    drag.appendChild(arrowParent);
                    foundids.push(layer[i].id);
                    allids.push(layer[i].id);
                }
            }
            if (foundids.length == 0) {
                flag = true;
            } else {
                layer = blocks.filter(a => foundids.includes(a.parent));
                foundids = [];
            }
        }
        for (var i = 0; i < blocks.filter(a => a.parent == blockid).length; i++) {
            var blocknumber = blocks.filter(a => a.parent == blockid)[i];
            blocks = blocks.filter(function(e) {
                return e.id != blocknumber
            });
        }
        for (var i = 0; i < allids.length; i++) {
            var blocknumber = allids[i];
            blocks = blocks.filter(function(e) {
                return e.id != blocknumber
            });
        }
        if (blocks.length > 1) {
            rearrangeMe();
        }
        action("UPDATE",false,"dragblock");
    }
    if (store.getState().active) {
        drag.style.left = mouse_x - store.getState().dragx + "px";
        drag.style.top = mouse_y - store.getState().dragy + "px";
    } else if (rearrange) {
        drag.style.left = mouse_x - store.getState().dragx - (window.scrollX + store.getState().absx) + canvas_div.scrollLeft + "px";
        drag.style.top = mouse_y - store.getState().dragy - (window.scrollY + store.getState().absy) + canvas_div.scrollTop + "px";
        blockstemp.filter(a => a.id == parseInt(drag.querySelector(".blockid").value)).x = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + canvas_div.scrollLeft;
        blockstemp.filter(a => a.id == parseInt(drag.querySelector(".blockid").value)).y = (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height) / 2) + canvas_div.scrollTop;
    }
    if (store.getState().active || rearrange) {
        if (mouse_x > canvas_div.getBoundingClientRect().width + canvas_div.getBoundingClientRect().left - 10 && mouse_x < canvas_div.getBoundingClientRect().width + canvas_div.getBoundingClientRect().left + 10) {
            canvas_div.scrollLeft += 10;
        } else if (mouse_x < canvas_div.getBoundingClientRect().left + 10 && mouse_x > canvas_div.getBoundingClientRect().left - 10) {
            canvas_div.scrollLeft -= 10;
        } else if (mouse_y > canvas_div.getBoundingClientRect().height + canvas_div.getBoundingClientRect().top - 10 && mouse_y < canvas_div.getBoundingClientRect().height + canvas_div.getBoundingClientRect().top + 10) {
            canvas_div.scrollTop += 10;
        } else if (mouse_y < canvas_div.getBoundingClientRect().top + 10 && mouse_y > canvas_div.getBoundingClientRect().top - 10) {
            canvas_div.scrollLeft -= 10;
        }
        var xpos = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + canvas_div.scrollLeft - canvas_div.getBoundingClientRect().left;
        var ypos = (drag.getBoundingClientRect().top + window.scrollY) + canvas_div.scrollTop - canvas_div.getBoundingClientRect().top;
        var blocko = blocks.map(a => a.id);
        for (var i = 0; i < blocks.length; i++) {
            if (checkAttach(blocko[i])) {
                document.querySelector(".blockid[value='" + blocko[i] + "']").parentNode.appendChild(document.querySelector(".indicator"));
                document.querySelector(".indicator").style.left = (document.querySelector(".blockid[value='" + blocko[i] + "']").parentNode.offsetWidth / 2) - 5 + "px";
                document.querySelector(".indicator").style.top = document.querySelector(".blockid[value='" + blocko[i] + "']").parentNode.offsetHeight + "px";
                document.querySelector(".indicator").classList.remove("invisible");
                break;
            } else if (i == blocks.length - 1) {
                if (!document.querySelector(".indicator").classList.contains("invisible")) {
                    document.querySelector(".indicator").classList.add("invisible");
                }
            }
        }
    }
  }

  function checkOffset() {
    action("UPDATE",blocks.map(a => a.x),"offsetleft");
    var widths = blocks.map(a => a.width);
    var mathmin = store.getState().offsetleft.map(function(item, index) {
        return item - (widths[index] / 2);
    });
    action("UPDATE",Math.min.apply(Math, mathmin),"offsetleft");
    if (store.getState().offsetleft < (canvas_div.getBoundingClientRect().left + window.scrollX - store.getState().absx)) {
        var blocko = blocks.map(a => a.id);
        for (var w = 0; w < blocks.length; w++) {
            document.querySelector(".blockid[value='" + blocks.filter(a => a.id == blocko[w])[0].id + "']").parentNode.style.left = blocks.filter(a => a.id == blocko[w])[0].x - (blocks.filter(a => a.id == blocko[w])[0].width / 2) - store.getState().offsetleft + canvas_div.getBoundingClientRect().left - store.getState().absx + 20 + "px";
            if (blocks.filter(a => a.id == blocko[w])[0].parent != -1) {
                var arrowblock = blocks.filter(a => a.id == blocko[w])[0];
                var arrowx = arrowblock.x - blocks.filter(a => a.id == blocks.filter(a => a.id == blocko[w])[0].parent)[0].x;
                if (arrowx < 0) {
                    document.querySelector('.arrowid[value="' + blocko[w] + '"]').parentNode.style.left = (arrowblock.x - store.getState().offsetleft + 20 - 5) + canvas_div.getBoundingClientRect().left - store.getState().absx + "px";
                } else {
                    document.querySelector('.arrowid[value="' + blocko[w] + '"]').parentNode.style.left = blocks.filter(id => id.id == blocks.filter(a => a.id == blocko[w])[0].parent)[0].x - 20 - store.getState().offsetleft + canvas_div.getBoundingClientRect().left - store.getState().absx + 20 + "px";
                }
            }
        }
        for (var w = 0; w < blocks.length; w++) {
            blocks[w].x = (document.querySelector(".blockid[value='" + blocks[w].id + "']").parentNode.getBoundingClientRect().left + window.scrollX) + (canvas_div.scrollLeft) + (parseInt(window.getComputedStyle(document.querySelector(".blockid[value='" + blocks[w].id + "']").parentNode).width) / 2) - 20 - canvas_div.getBoundingClientRect().left;
        }
    }
  }

  function rearrangeMe() {
    var result = blocks.map(a => a.parent);
    for (var z = 0; z < result.length; z++) {
        if (result[z] == -1) {
            z++;
        }
        var totalwidth = 0;
        var totalremove = 0;
        var maxheight = 0;
        for (var w = 0; w < blocks.filter(id => id.parent == result[z]).length; w++) {
            var children = blocks.filter(id => id.parent == result[z])[w];
            if (blocks.filter(id => id.parent == children.id).length == 0) {
                children.childwidth = 0;
            }
            if (children.childwidth > children.width) {
                if (w == blocks.filter(id => id.parent == result[z]).length - 1) {
                    totalwidth += children.childwidth;
                } else {
                    totalwidth += children.childwidth + paddingx;
                }
            } else {
                if (w == blocks.filter(id => id.parent == result[z]).length - 1) {
                    totalwidth += children.width;
                } else {
                    totalwidth += children.width + paddingx;
                }
            }
        }
        if (result[z] != -1) {
            blocks.filter(a => a.id == result[z])[0].childwidth = totalwidth;
        }
        for (var w = 0; w < blocks.filter(id => id.parent == result[z]).length; w++) {
            var children = blocks.filter(id => id.parent == result[z])[w];
            const r_block = document.querySelector(".blockid[value='" + children.id + "']").parentNode;
            const r_array = blocks.filter(id => id.id == result[z]);
            r_block.style.top = r_array.y + paddingy + canvas_div.getBoundingClientRect().top - store.getState().absy + "px";
            r_array.y = r_array.y + paddingy;
            if (children.childwidth > children.width) {
                r_block.style.left = r_array[0].x - (totalwidth / 2) + totalremove + (children.childwidth / 2) - (children.width / 2) - (store.getState().absx + window.scrollX) + canvas_div.getBoundingClientRect().left + "px";
                children.x = r_array[0].x - (totalwidth / 2) + totalremove + (children.childwidth / 2);
                totalremove += children.childwidth + paddingx;
            } else {
                r_block.style.left = r_array[0].x - (totalwidth / 2) + totalremove - (store.getState().absx + window.scrollX) + canvas_div.getBoundingClientRect().left + "px";
                children.x = r_array[0].x - (totalwidth / 2) + totalremove + (children.width / 2);
                totalremove += children.width + paddingx;
            }

            var arrowblock = blocks.filter(a => a.id == children.id)[0];
            var arrowx = arrowblock.x - blocks.filter(a => a.id == children.parent)[0].x + 20;
            var arrowy = paddingy;
            updateArrow(arrowblock, arrowx, arrowy, children);
        }
    }
  }
  function blockGrabbed(block) {
    grab(block);
  }
  
  function blockReleased() {
    release();
  }
  
  function blockSnap(drag, first, parent) {
    return snapping(drag, first, parent);
  }
  
  function beforeDelete(drag, parent) {
    return rearrange(drag, parent) || rearrange;
  }
  
  function addEventListenerMulti(type, listener, capture, selector) {
    var nodes = document.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].addEventListener(type, listener, capture);
    }
  }
  
  function removeEventListenerMulti(type, listener, capture, selector) {
    var nodes = document.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].removeEventListener(type, listener, capture);
    }
  }

  export const ReactFlowy = (props) => {
    if (!Element.prototype.matches) {
        Element.prototype.matches = Element.prototype.msMatchesSelector ||
            Element.prototype.webkitMatchesSelector;
    }
    if (!Element.prototype.closest) {
        Element.prototype.closest = function(s) {
            var el = this;
            do {
                if (Element.prototype.matches.call(el, s)) return el;
                el = el.parentElement || el.parentNode;
            } while (el !== null && el.nodeType === 1);
            return null;
        };
    }
    useEffect(() => {
        load(props);
        document.addEventListener("mousedown", beginDrag);
        document.addEventListener("mousedown", touchblock, false);
        document.addEventListener("touchstart", beginDrag);
        document.addEventListener("touchstart", touchblock, false);
        document.addEventListener("mouseup", touchblock, false);
        document.addEventListener("mousemove", moveBlock, false);
        document.addEventListener("touchmove", moveBlock, false);    
        document.addEventListener("mouseup", endDrag, false);
        document.addEventListener("touchend", endDrag, false); 
        return () => {
            document.removeEventListener("mousedown", beginDrag);
            document.removeEventListener("mousedown", touchblock, false);
            document.removeEventListener("touchstart", beginDrag);
            document.removeEventListener("touchstart", touchblock, false);
            document.removeEventListener("mouseup", touchblock, false);
            document.removeEventListener("mousemove", moveBlock, false);
            document.removeEventListener("touchmove", moveBlock, false);
            document.removeEventListener("mouseup", endDrag, false);
            document.removeEventListener("touchend", endDrag, false);  
        }
    }, [])
    return (
      <Provider store={store}>
        <div id={props.id || "canvas"}></div>
      </Provider>
      );    
  }

