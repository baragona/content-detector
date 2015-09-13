


var $ = jQuery;

var elementIsOnTop = function(el){
  var bounds = boundsForElem(el);
  var rect = rectForBounds(bounds);

  var points = distributedPointsInRect(rect);


  for (var i in points){
    var point = points[i];
    var elementAtPoint = document.elementFromPoint(point.x, point.y);
    if(elementAtPoint == null){
      //debugger;
    }
    if(elementAtPoint == el[0]){
      return true;
    }else if(elementAtPoint && jQuery.contains( elementAtPoint, el[0] )){
      return true;
    }/*else if(elementAtPoint && jQuery.contains( el[0], elementAtPoint )){
      return true;
    }*/
  }
  return false;

};

jQuery.fn.extend({
    getPath: function() {
        var pathes = [];

        this.each(function(index, element) {
            var path, $node = jQuery(element);

            while ($node.length) {
                var realNode = $node.get(0), name = realNode.localName;
                if (!name) { break; }

                name = name.toLowerCase();
                var parent = $node.parent();
                var sameTagSiblings = parent.children(name);

                if (sameTagSiblings.length > 1)
                {
                    allSiblings = parent.children();
                    var index = allSiblings.index(realNode) +1;
                    if (index > 0) {
                        name += ':nth-child(' + index + ')';
                    }
                }

                path = name + (path ? ' > ' + path : '');
                $node = parent;
            }

            pathes.push(path);
        });

        return pathes.join(',');
    }
});

var allContentElems = function(){
	var getTextNodesIn = function(el) {
    		return jQuery(el).find(":not(iframe,script,style,noscript)").addBack().contents().filter(function() {
        		if( this.nodeType == 3){
        		  if(this.data.replace(/\s+/g,'').length >0){

                return true;
        		  }else{
        		    return false;
        		  }
        		}else{
        		  return false;
        		}
    		});
	};
	var nodes = getTextNodesIn(jQuery('body')).add('a,img,iframe,input,select,textarea,a *');


	var edge_div = $('#udm_floater_div')[0];
	if(edge_div){
    nodes = nodes.filter(function(){
      var el = this;
      if(el.nodeType == 3){
        el = el.parentNode;
      }
      if(edge_div.contains(el) || edge_div === el){
        return false;
      }else{
        return true;
      }
    });
	}
	return nodes;
};

var makeRect = function(x, y, width, height){
  return {
    x:x,
    y:y,
    width:width,
    height:height
  };
};

var distributedPointsInRect = function(rect){
  var points = [];

  var intervals = [0.05, .5, .95];
  for(var i = 0; i < intervals.length; i++){
    for(var j = 0; j < intervals.length; j++){
      var x = rect.x;
      var y = rect.y;
      x += intervals[i]*rect.width;
      y += intervals[j]*rect.height;
      points.push({x:x, y:y});
    }
  }

  return points;
};

var rectIntersection = function(a, b) {
  var x1 = b.x, y1 = b.y, x2 = x1+b.width, y2 = y1+b.height;
  if (a.x > x1) { x1 = a.x; }
  if (a.y > y1) { y1 = a.y; }
  if (a.x + a.width < x2) { x2 = a.x + a.width; }
  if (a.y + a.height < y2) { y2 = a.y + a.height; }
  return (x2 <= x1 || y2 <= y1) ? null : makeRect(x1, y1, x2-x1, y2-y1);
};

var rectContainsRect = function(out, inside){
  if(inside.x < out.x || inside.y < out.y){
    return false;
  }

  if((inside.x + inside.width) > (out.x + out.width) || (inside.y + inside.height) > (out.y + out.height)){
    return false;
  }

  return true;
};

var boundsForRect = function(rect){
  return {
    left:   rect.x,
    top:    rect.y,
    right:  (rect.x + rect.width),
    bottom: (rect.y + rect.height)
  };
};

var rectForBounds = function(bounds){
  return {
    x:bounds.left,
    y:bounds.top,
    width:(bounds.right - bounds.left),
    height:(bounds.bottom - bounds.top)
  };
};

var getTextNodeRect = function(textNode){
  var range;
  if(document.createRange){
    range = document.createRange();
    range.selectNodeContents(textNode);
  }else{
    range = document.body.createTextRange();
    range.moveToElementText(textNode.parentNode);
  }


  var rects = range.getClientRects();
  if(rects.length > 0){
    return boundingBoxForBoundsList(rects);
  }
  return null;
};

var boundsForElem = function(el){
  if(el[0].getBoundingClientRect){
    return el[0].getBoundingClientRect();
  }else if(el[0].nodeType == 3){
    //text node
    return getTextNodeRect(el[0]);
  }else{
    console.log('cant get bounds for this element');
    console.log(el);
    return null;
  }


};

var windowRect = function(){
  var rect = {
    x: 0,
    y: 0,
    width: window.innerWidth,
    height: window.innerHeight
  };

  return rect;
};

var windowRectTrimmed = function(){
  var rect = windowRect();

  var diff = rect.height - 600;
  if(diff > 0){
    rect.height = 600;
    rect.y = diff;
  }
  return rect;
};

var elementVisibleBounds = function(jq_el, el_bounds, interestAreaRect){
  //returns nothing if not visible, or the visible bounds.

  if(el_bounds == null){
    //console.log('null bounds');
    return;
  }

  var width = el_bounds.right - el_bounds.left;
  var height = el_bounds.bottom - el_bounds.top;
  // really tiny or thin elements are not considered content
  if(width < 2 || height < 2){
    return;
  }

  // if the element is off screen, it cant be tested with the on top test.

  //if(el_bounds.top > window.innerHeight || el_bounds.left > window.innerWidth || el_bounds.bottom < 0 || el_bounds.right < 0  ){
  if(rectIntersection(interestAreaRect, rectForBounds(el_bounds)) == null){
    //console.log('off the page:');
    //console.log(el);
    return;
  }

  var el = jq_el[0];
  if(el.nodeType == 3){
    //text node, visible doesnt work for text nodes
    if(! jq_el.parent().is(':visible')){
      //console.log('text nodes parent not visible:');
      //console.log(el);
      return;
    }
  }else{
    //not text node
    if(! jq_el.is(':visible')){
      //checks if it takes up space in the DOM, not opactiy/visibility
      //console.log('not visible:');
      //console.log(el);
      return;
    }
  }

  if(! elementIsOnTop(jq_el)){
    //console.log('element is not on top:');
    //console.log(el);
    return;
  }

  var maybeClippingParents = jq_el.parents().filter(function(){var par = $(this);return (par.css('overflow') != 'visible' || par.css('opacity') < .05 || par.css('visibility') === 'hidden' )});
  //console.log(maybeClippingParents);
  maybeClippingParents.each(function(){
    if(el_bounds === null){
      return;
    }

    var parent = $(this);

    if(parent.css('opacity') < .05 ||parent.css('visibility') === 'hidden'){
      //always invisible if parent is invisible
      el_bounds = null;
      return;
    }

    var intersectRect = rectIntersection(rectForBounds(el_bounds),rectForBounds(boundsForElem(parent)));
    if(intersectRect){
      el_bounds = boundsForRect(intersectRect);
    }else{
      //console.log('parent completely clips child');
      //console.log(this);
      el_bounds = null;
    }
  });
  if(el_bounds === null){
    return;
  }



  return el_bounds;
};

var shuffle = function (array) {
    var counter = array.length, temp, index;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
};

var allVisibleElementsRect = function(elems,interestAreaRect, callback){
  var elem_plus_bounds = [];
  for (var i=0; i < elems.length; i++){
    var elem = $(elems[i]);

    var obj = {
      elem: elem,
      bounds: boundsForElem(elem)
    };
    elem_plus_bounds.push(obj);
  }

  shuffle(elem_plus_bounds);

  var bounds_list = [];
  var currentBoundingBox = null;
  for (var i in elem_plus_bounds){
    var obj = elem_plus_bounds[i];

    if(obj.bounds == null){
      //console.log('null bounds');
      continue;
    }

    if(currentBoundingBox){
      if(rectContainsRect(currentBoundingBox, rectForBounds(obj.bounds))){
        //console.log('rect contains rect');
        //console.log(obj.elem);
        continue;
      }
    }

    var vis_bounds = elementVisibleBounds(obj.elem, obj.bounds, interestAreaRect);
    if(vis_bounds != null){
/*
      (function(vis_bounds,obj){
        setTimeout(function(){
          $('<div>').addClass('content-indicator').attr('for', obj.elem.getPath()).css({position:'fixed','background-color':'blue','z-index':4000000000,width:(vis_bounds.right - vis_bounds.left)+'px',height:(vis_bounds.bottom - vis_bounds.top)+'px',left:vis_bounds.left+'px',top:vis_bounds.top+'px'}).appendTo('body');
        }, 120);
      })(vis_bounds,obj);
*/
      bounds_list.push(vis_bounds);
      if(currentBoundingBox){
        currentBoundingBox = rectForBounds(boundingBoxForBoundsList([boundsForRect(currentBoundingBox), vis_bounds]));
      }else{
        currentBoundingBox = rectForBounds(vis_bounds);
      }
    }
  }

  callback(currentBoundingBox);
};

var boundingBoxForBoundsList = function (bounds_list) {
	var bounds = {
		left: Number.POSITIVE_INFINITY,
		top: Number.POSITIVE_INFINITY,
		right: Number.NEGATIVE_INFINITY,
		bottom: Number.NEGATIVE_INFINITY,
		width: Number.NaN,
		height: Number.NaN
	};

	for (var i in bounds_list){

    var el_bounds = bounds_list[i];

		if (el_bounds.left < bounds.left)
		bounds.left = el_bounds.left;

		if (el_bounds.top < bounds.top)
		bounds.top = el_bounds.top;

		if (el_bounds.right > bounds.right)
		bounds.right = el_bounds.right;

		if (el_bounds.bottom > bounds.bottom)
		bounds.bottom = el_bounds.bottom;
	}

	bounds.width = bounds.right - bounds.left;
	bounds.height = bounds.bottom - bounds.top;
	return bounds;
};

var getCombinedScrollPos = function(){
  return $(window).scrollTop() + ',' + $(window).scrollLeft();
};

var getCombinedWindowSize = function(){
  return $(window).width() + ',' + $(window).height();
};

var lastDetectedContent = 0;
var scrollPos = getCombinedScrollPos();
var windowSize = getCombinedWindowSize();

var detectContent = function(){
  lastDetectedContent = new Date();
  scrollPos = getCombinedScrollPos();
  windowSize = getCombinedWindowSize();

  $('.content-indicator').detach();

  var d1 = new Date();
  var elems = allContentElems();
  var interestAreaRect = windowRectTrimmed();
  var d2 = new Date();
  console.log('it took '+ (d2-d1));
  allVisibleElementsRect(elems,interestAreaRect,function(vis_rect){
    var vis_bounds = boundsForRect(vis_rect);
    setTimeout(function(){


      $('<div>').attr('id', 'content-overlay').addClass('content-indicator').css({position:'fixed','background-color':'rgba(255, 0, 0, 0.3)','pointer-events':'none','z-index':4000000000,width:(vis_bounds.right - vis_bounds.left)+'px',height:(vis_bounds.bottom - vis_bounds.top)+'px',left:vis_bounds.left+'px',top:vis_bounds.top+'px'}).appendTo('body');
    }, 100);
  });




};

//window.onscroll = detectContent;
//window.onresize = detectContent;
detectContent();
setInterval(function(){
  if((new Date()) - lastDetectedContent > 4000){
    detectContent();
  }else if(scrollPos !== getCombinedScrollPos()){
    detectContent();
  }else if(windowSize !==getCombinedWindowSize()){
    detectContent();
  }
}, 1000);