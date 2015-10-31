/*
CinsImp
Stack View

*********************************************************************************
Copyright (c) 2009-2015, Joshua Hawcroft
All rights reserved.

 May all beings have happiness and the cause of happiness.
 May all beings be free of suffering and the cause of suffering.
 May all beings rejoice for the supreme happiness which is without suffering.
 May all beings abide in the great equanimity; free of attachment and delusion.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the product nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDERS BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


function View(in_stack, in_bkgnd, in_card) 
{
	View.current = this;
	
	this._current_object = null;
	
	this._stack = in_stack;
	this._bkgnd = in_bkgnd;
	//in_bkgnd.set_view(this);
	this._card = in_card;
	
	this._paint = null;
	this._icon_index = {};
	
	this._index_icons();
	
	this._init_view();
}

View.current = null;


View.MODE_BROWSE = 0;
View.MODE_AUTHORING = 1;
View.MODE_PAINTING = 2;

View.TOOL_BROWSE = 1;
View.TOOL_BUTTON = 2;
View.TOOL_FIELD = 3;
View.TOOL_SELECT = 4;
View.TOOL_LASSO = 5;
View.TOOL_PENCIL = 6;
View.TOOL_BRUSH = 7;
View.TOOL_ERASER = 8;
View.TOOL_LINE = 9;
View.TOOL_SPRAY = 10;
View.TOOL_RECTANGLE = 11;
View.TOOL_ROUND_RECT = 12;
View.TOOL_BUCKET = 13;
View.TOOL_OVAL = 14;
View.TOOL_FREE_SHAPE = 15;
View.TOOL_TEXT = 16;
View.TOOL_REG_POLY = 17;
View.TOOL_FREE_POLY = 18;
View.TOOL_EYEDROPPER = 19;


View.CURRENT_STACK = 0;
View.CURRENT_BKGND = 1;
View.CURRENT_CARD = 2;
View.CURRENT_OBJECT = 3;
View.CURRENT_BUTTON = 4;
View.CURRENT_FIELD = 5;

/*

Experimental technology - not stable - also doesn't work this easily since the event object must be cloned.
Going to have to use a simpler approach and just not have graphical masking of objects,
or else, find the target ourselves?

View.prototype._redirect_event = function(in_event)
{
	if (this._edit_bkgnd) return false;
	
	this._layer_obj_card.style.visibility = 'hidden';
	var blocked_target = document.elementFromPoint(in_event.pageX, in_event.pageY); // not supported on Android and subject to change? ***
	this._layer_obj_card.style.visibility = 'visible';
	
	if (blocked_target && blocked_target.className != 'Layer')
	{
		blocked_target.dispatchEvent(in_event);
		return true;
	}
	
	return false;
}
*/

View.prototype._init_view = function()
{
	this._edit_bkgnd = false;
	this._mode = View.MODE_BROWSE;
	this._tool = View.TOOL_BROWSE;
	this._container = Application._stack_window;
	
	this._rebuild_list = [];  /* can be processed at idle, if anything in it *** TODO potentially */
	//this._next_id = 1;
	
	var me = this;
	this._container.addEventListener('mousedown', 
		function (in_event) { me._author_point_start(null, [in_event.pageX, in_event.pageY]); });
	
	this._size = [this._container.clientWidth, this._container.clientHeight];
	
	this._objects_card = [];
	this._objects_bkgnd = [];
	
	this._selected_objects = [];
	
	/*this._layer_obj_bkgnd = document.createElement('div');
	this._layer_obj_bkgnd.id = 'LayerObjBkgnd';
	this._layer_obj_bkgnd.style.zIndex = 3;
	this._layer_obj_bkgnd.className = 'Layer';
	this._layer_obj_bkgnd.style.width = this._size[0] + 'px';
	this._layer_obj_bkgnd.style.height = this._size[1] + 'px';*/
	
	this._layer_bkgnd_art = document.createElement('div');
	this._layer_bkgnd_art.className = 'LayerArt';
	this._layer_bkgnd_art.style.zIndex = 3;
	this._layer_bkgnd_art.style.width = this._size[0] + 'px';
	this._layer_bkgnd_art.style.height = this._size[1] + 'px';
	
	this._layer_card_art = document.createElement('div');
	this._layer_card_art.className = 'LayerArt';
	this._layer_card_art.style.zIndex = 4;
	this._layer_card_art.style.width = this._size[0] + 'px';
	this._layer_card_art.style.height = this._size[1] + 'px';
	
	this._layer_paint = document.createElement('div');
	this._layer_paint.className = 'PaintCanvas';
	this._layer_paint.style.zIndex = 6;
	this._layer_paint.style.width = this._size[0] + 'px';
	this._layer_paint.style.height = this._size[1] + 'px';
	this._layer_paint.style.visibility = 'hidden';
	
	this._layer_obj_card = document.createElement('div');
	this._layer_obj_card.id = 'LayerObjCard';
	this._layer_obj_card.style.zIndex = 5;
	this._layer_obj_card.className = 'Layer';
	this._layer_obj_card.style.width = this._size[0] + 'px';
	this._layer_obj_card.style.height = this._size[1] + 'px';
	
	//this._layer_obj_card = document.createElement('div');
	//this._layer_obj_card = document.createElement('div');
	//this._container.appendChild(this._layer_obj_bkgnd);
	this._container.appendChild(this._layer_bkgnd_art);
	this._container.appendChild(this._layer_card_art);
	this._container.appendChild(this._layer_paint);
	this._container.appendChild(this._layer_obj_card);
	
	this._bkgnd_indicator = document.createElement('div');
	this._bkgnd_indicator.className = 'BkgndIndicator';
	this._bkgnd_indicator.style.left = this._container.offsetLeft - 4 + 'px';
	this._bkgnd_indicator.style.top = this._container.offsetTop - 4 + 'px';
	this._bkgnd_indicator.style.width = this._container.clientWidth + 8 + 'px';
	this._bkgnd_indicator.style.height = this._container.clientHeight + 8 + 'px';
	document.body.appendChild(this._bkgnd_indicator);
	
	this._rebuild_layers();
}


View.prototype._indicate_tool = function(in_tool)
{
	/* clear the current tool indication */
	var img_list = Palette.Tools._root.children[0].children;
	for (var t = 0; t < img_list.length; t++)
	{
		var palette_img = img_list[t].children[0];
		palette_img.src = palette_img.src.replace('hilite', 'normal');
	}
	
	/* set the new tool indication */
	var palette_img = document.getElementById('Tool'+in_tool);//Palette.Tools._root.children[0].children[in_tool - 1].children[0];
	palette_img.src = palette_img.src.replace('normal', 'hilite');
	
	/* change the cursor on the view */
	this._container.classList.toggle('CursBrowse', false);
	this._container.classList.toggle('CursAuthor', false);
	switch (in_tool)
	{
	case View.TOOL_BROWSE:
		this._container.classList.toggle('CursBrowse', true);
		break;
	case View.TOOL_BUTTON:
	case View.TOOL_FIELD:
		this._container.classList.toggle('CursAuthor', true);
		break;
	default:
		break;
	}
	
	//this._container.classList.toggle('ShowBkgndNumTags', (this._tool == View.TOOL_FIELD));
	//this._container.classList.toggle('ShowCardNumTags', (this._tool == View.TOOL_FIELD && (!this._edit_bkgnd)));
}


View.prototype.choose_color = function(in_color)
{
	if (this._paint)
		this._paint.choose_color(in_color);
}


View.prototype._show_object_outlines = function()
{
	if (this._tool == View.TOOL_FIELD)
	{
		this._layer_obj_card.classList.add('FieldOutlines');
		//this._layer_obj_bkgnd.classList.add('FieldOutlines');
	}
	else
	{
		this._layer_obj_card.classList.remove('FieldOutlines');
		//this._layer_obj_bkgnd.classList.remove('FieldOutlines');
	}
	if (this._tool == View.TOOL_BUTTON)
	{
		this._layer_obj_card.classList.add('ButtonOutlines');
		//this._layer_obj_bkgnd.classList.add('ButtonOutlines');
	}
	else
	{
		this._layer_obj_card.classList.remove('ButtonOutlines');
		//this._layer_obj_bkgnd.classList.remove('ButtonOutlines');
	}
}


View.prototype._configure_obj_display = function()
{
	this._author_fields = (this._tool == View.TOOL_FIELD);
	this._author_buttons = (this._tool == View.TOOL_BUTTON);
	this._text_editable = true; // TODO: user-level, user-modify and cant-modify
	if (this._mode != View.MODE_BROWSE)
		this._text_editable = false;
	
	var objects = this._card.get_objects();
	for (var o = 0; o < objects.length; o++)
	{
		var obj = objects[o];
		obj.set_dom_visiblity(!this._edit_bkgnd);
		obj.set_dom_editability(this._text_editable, !this._edit_bkgnd);
		
	}
	
	var objects = this._bkgnd.get_objects();
	for (var o = 0; o < objects.length; o++)
	{
		var obj = objects[o];
		var te = this._text_editable;
		var shared = obj.get_attr('shared');
		if (this._edit_bkgnd && !shared) te = false;
		if (!this._edit_bkgnd && shared) te = false;
		var tv = te || !this._edit_bkgnd;
		obj.set_dom_visiblity(true);
		obj.set_dom_editability(te, tv);
	}
}


View.prototype._mode_changed = function()
{
	
	
	this._configure_obj_display();
}


View.prototype.object_is_selected = function(in_object)
{
	var idx = this._selected_objects.indexOf(in_object);
	return (idx >= 0);
}


View.prototype.select_object = function(in_object, in_selected)
{
	var idx = this._selected_objects.indexOf(in_object);
	if (idx >= 0 && (!in_selected))
	{
		this._selected_objects.splice(idx, 1);
		in_object._set_selected(in_selected);
	}
	else if (idx < 0 && in_selected)
	{
		this._selected_objects.push(in_object);
		in_object._set_selected(in_selected);
	}
}


View.prototype.select_none = function()
{
	this._current_object = null;
	
	for (var o = this._selected_objects.length - 1; o >= 0; o--)
	{
		var obj = this._selected_objects[o];
		obj._set_selected(false);
	}
	this._selected_objects.length = 0;
}


View.prototype._browse_point_start = function(in_object, in_coords)
{
	if (this._mode != View.MODE_BROWSE) return;
	
	alert('Click on object '+ in_object);
}


View.prototype._guide_drag_layer = function(in_context, in_object, in_rect, in_layer, no_size)
{
	for (var o = 0; o < in_layer.length; o++)
	{
		var obj = in_layer[o];
		if (obj == in_object) continue;
		
		var deltaT = Math.abs(obj._position[1] - in_rect[1]);
		var deltaB = Math.abs(obj._position[3] - in_rect[1]);
		var deltaL = Math.abs(obj._position[0] - in_rect[0]);
		var deltaR = Math.abs(obj._position[2] - in_rect[0]);
		
		if (deltaT < in_context.objYDelta)
		{
			in_context.objYDelta = deltaT;
			in_context.objY = obj;
			in_context.objYCoord = obj._position[1];
			in_context.alignY = 0;
		}
		if (deltaB < in_context.objYDelta)
		{
			in_context.objYDelta = deltaB;
			in_context.objY = obj;
			in_context.objYCoord = obj._position[3];
			in_context.alignY = 0;
		}
		if (deltaL < in_context.objXDelta)
		{
			in_context.objXDelta = deltaL;
			in_context.objX = obj;
			in_context.objXCoord = obj._position[0];
			in_context.alignX = 0;
		}
		if (deltaR < in_context.objXDelta)
		{
			in_context.objXDelta = deltaR;
			in_context.objX = obj;
			in_context.objXCoord = obj._position[2];
			in_context.alignX = 0;
		}
		
		if (no_size) continue;
		var deltaT = Math.abs(obj._position[1] - in_rect[3]);
		var deltaB = Math.abs(obj._position[3] - in_rect[3]);
		var deltaL = Math.abs(obj._position[0] - in_rect[2]);
		var deltaR = Math.abs(obj._position[2] - in_rect[2]);
		
		if (deltaT < in_context.objYDelta)
		{
			in_context.objYDelta = deltaT;
			in_context.objY = obj;
			in_context.objYCoord = obj._position[1];
			in_context.alignY = 1;
		}
		if (deltaB < in_context.objYDelta)
		{
			in_context.objYDelta = deltaB;
			in_context.objY = obj;
			in_context.objYCoord = obj._position[3];
			in_context.alignY = 1;
		}
		if (deltaL < in_context.objXDelta)
		{
			in_context.objXDelta = deltaL;
			in_context.objX = obj;
			in_context.objXCoord = obj._position[0];
			in_context.alignX = 1;
		}
		if (deltaR < in_context.objXDelta)
		{
			in_context.objXDelta = deltaR;
			in_context.objX = obj;
			in_context.objXCoord = obj._position[2];
			in_context.alignX = 1;
		}
	}
}


// we can use this for resize too in theory...
View.prototype._guide_drag = function(in_object, in_loc, no_size, out_snapped)
{
	const THRESHOLD = 8;

	var context = {
		objY: 		null,
		objYDelta:	1000000,
		objYCoord: 	0,
		alignY:		0,		// 0 = top, 1 = bottom (of object)
		objX:		null,
		objXDelta:	1000000,
		objXCoord:	0,
		alignX: 	0		// 0 = left, 1 = right (of object)
	};
	
	var proposed_rect = [in_loc[0], in_loc[1], 
		in_loc[0] + in_object._position[4], in_loc[1] + in_object._position[5]];
	
	this._guide_drag_layer(context, in_object, proposed_rect, this._card.get_objects(), no_size);
	this._guide_drag_layer(context, in_object, proposed_rect, this._bkgnd.get_objects(), no_size);
	
	if (context.objY != null && context.objYDelta <= THRESHOLD)
	{
		in_loc[1] = context.objYCoord;
		if (context.alignY != 0) in_loc[1] -= in_object._position[5];
		out_snapped[1] = (context.alignY == 0 ? -1 : 1);
	}
	else out_snapped[1] = 0;
	if (context.objX != null && context.objXDelta <= THRESHOLD)
	{
		in_loc[0] = context.objXCoord;
		if (context.alignX != 0) in_loc[0] -= in_object._position[4];
		out_snapped[0] = (context.alignX == 0 ? -1 : 1);
	}
	else out_snapped[0] = 0;
}


View.prototype._author_point_start = function(in_object, in_coords)
{
	if (this._mode != View.MODE_AUTHORING) return;
	
	if (!in_object)
	{
		this.select_none();
		return;
	}
	
	if ((in_object.get_type() == Field.TYPE && this._tool != View.TOOL_FIELD) ||
		(in_object.get_type() == Button.TYPE && this._tool != View.TOOL_BUTTON)) return;

	if (Util.modifier_shift)
	{
		if (this.object_is_selected(in_object))
		{
			this.select_object(in_object, false);
			return;
		}
		else
			this.select_object(in_object, true);
	}
	else
	{
		if (!this.object_is_selected(in_object))
		{
			this.select_none();
			this.select_object(in_object, true);
		}
	}
	if (this.object_is_selected(in_object))
	
	Drag.begin_move(in_coords, this._selected_objects, this._guide_drag.bind(this));
}


View.prototype.choose_tool = function(in_tool)
{
	this.select_none();
	
	this._tool = in_tool;
	
	/* instantiate the paint subsystem if appropriate
	and configure the paint environment */
	if (in_tool != View.TOOL_BROWSE && in_tool != View.TOOL_BUTTON && in_tool != View.TOOL_FIELD)
	{
		if (!this._paint) 
		{
			this._paint = new Paint(this._layer_paint, this._size);
			var me = this;
			this._paint.onenterpaint = function() { me.paint_revert(); };
			this._paint.onexitpaint = function() { me.paint_keep(); me._rebuild_art(); };
		}
		if (this._paint) 
			this._paint.choose_tool(in_tool);
			// probably need to reinit with a different card size here; only if different?
	}
	else
	{
		if (this._paint)
			this._paint.choose_tool(in_tool);
	}
	
	/* determine the mode */
	if (this._tool == View.TOOL_BROWSE) this._mode = View.MODE_BROWSE;
	else if (this._tool == View.TOOL_BUTTON ||
		this._tool == View.TOOL_FIELD) this._mode = View.MODE_AUTHORING;
	else this._mode = View.MODE_PAINTING;
	this._mode_changed();
	
	this._config_art_visibility();
	
	this._indicate_tool(in_tool);
	
	/* show object outlines */
	this._show_object_outlines();
}


View.prototype.is_browsing = function()
{
	return (View.MODE_BROWSE == this._mode);
}


View.prototype.edit_bkgnd = function(in_edit_bkgnd)
{
	this.select_none();
	this.paint_keep();
	this._rebuild_art();

	this._edit_bkgnd = in_edit_bkgnd;
	this._bkgnd_indicator.style.visibility = (this._edit_bkgnd ? 'visible' : 'hidden');
	
	this._configure_obj_display();
	this._config_art_visibility();
	this.paint_revert();
}


View.prototype.is_edit_bkgnd = function()
{
	return this._edit_bkgnd;
}


View.prototype.do_new = function()
{
	if (this._mode == View.MODE_BROWSE)
	{
		if (!this._edit_bkgnd) this.do_new_card();
		else this.do_new_bkgnd();
	}
	else if (this._mode == View.MODE_AUTHORING)
	{
		if (this._tool == View.TOOL_BUTTON) this.do_new_button();
		else this.do_new_field();
	}
}


View.prototype._centre_object = function(in_object)
{
	var obj_size = in_object.get_size();
	var new_loc = [(this._size[0] - obj_size[0]) / 2, (this._size[1] - obj_size[1]) / 2];
	in_object.set_loc(new_loc);
}


View.prototype._renumber_objects = function()
{
	var btn_num = 1;
	var fld_num = 1;
	for (var o = 0; o < this._objects_bkgnd.length; o++)
	{
		var obj = this._objects_bkgnd[o];
		obj.set_attr(LayerObject.ATTR_PART_NUM, o + 1);
		if (obj.get_type() == Button.TYPE)
			obj.set_attr(LayerObject.ATTR_KLAS_NUM, btn_num ++);
		else
			obj.set_attr(LayerObject.ATTR_KLAS_NUM, fld_num ++);
	}
	var btn_num = 1;
	var fld_num = 1;
	for (var o = 0; o < this._objects_card.length; o++)
	{
		var obj = this._objects_card[o];
		obj.set_attr(LayerObject.ATTR_PART_NUM, o + 1);
		if (obj.get_type() == Button.TYPE)
			obj.set_attr(LayerObject.ATTR_KLAS_NUM, btn_num ++);
		else
			obj.set_attr(LayerObject.ATTR_KLAS_NUM, fld_num ++);
	}
}


View.prototype.card = function()
{
	return View.current._card;
}


View.prototype.rebuild = function()
{
	for (var i = 0; i < this._rebuild_list.length; i++)
		this._rebuild_list[i].rebuild_dom();
	this._rebuild_list.length = 0;
}


View.prototype.needs_rebuild = function(in_object)
{
	this._rebuild_list.push(in_object);
}



View.prototype._rebuild_layers = function()
{
	/* remove all DOM objects from the layer */
	while (this._layer_obj_card.children.length > 0)
		this._layer_obj_card.removeChild( this._layer_obj_card.children[0] );
	
	/* add DOM objects to the layer, background first, card second */
	var objects = this._bkgnd.get_objects();
	for (var i = 0; i < objects.length; i++)
		this._layer_obj_card.appendChild( objects[i].create_dom(this) );
	var objects = this._card.get_objects();
	for (var i = 0; i < objects.length; i++)
		this._layer_obj_card.appendChild( objects[i].create_dom(this) );
	
	/* build the actual DOM objects as needed */
	this.rebuild();
	
	/* configure the objects appropriately to the current edit mode */
	this._configure_obj_display();
}


/*
	** only rebuild the actual display of the layers
*/
/*View.prototype._rebuild_layers = function()
{
	while (this._layer_obj_card.children.length > 0)
		this._layer_obj_card.removeChild( this._layer_obj_card.children[0] );

	for (var o = 0; o < this._objects_bkgnd.length; o++)
	{
		var obj = this._objects_bkgnd[o];
		this._layer_obj_card.appendChild(obj._div);
	}
	for (var o = 0; o < this._objects_card.length; o++)
	{
		var obj = this._objects_card[o];
		this._layer_obj_card.appendChild(obj._div);
	}
}*/


View.prototype._add_object = function(in_object)
{
	/*var existing_id = in_object.get_attr(LayerObject.ATTR_ID);
	if (existing_id >= this._next_id)
		this._next_id = existing_id + 1;*/
		
	
		
	if (!this._edit_bkgnd) 
	{
		//in_object.set_attr(LayerObject.ATTR_PART_NUM, this._objects_card.length + 1);
		//in_object._is_bkgnd = false;
		//this._objects_card.push(in_object);
		this._layer_obj_card.appendChild( in_object.create_dom(this) );
	}
	else 
	{
		//in_object.set_attr(LayerObject.ATTR_PART_NUM, this._objects_bkgnd.length + 1);
		//in_object._is_bkgnd = true;
		//this._objects_bkgnd.push(in_object);
		this._layer_obj_card.appendChild( in_object.create_dom(this) );
	}
	
	this._renumber_objects();
	
	this.rebuild();
	//this._layer_obj_card.style.visibility = 'hidden';
	//this._layer_obj_card.style.visibility = 'visible';
}


View.prototype.do_new_field = function()
{
	this.select_none();
	this.choose_tool(View.TOOL_FIELD);
	
	var field = new CinsImp.Model.Field(null, (this._edit_bkgnd ? this._bkgnd : this._card));
	this._centre_object(field);
	this._add_object(field);
	
	this.select_object(field, true);
}


View.prototype.do_new_button = function()
{
	this.select_none();
	this.choose_tool(View.TOOL_BUTTON);
	
	var button = new CinsImp.Model.Button(null, (this._edit_bkgnd ? this._bkgnd : this._card));
	this._centre_object(button);
	this._add_object(button);
	
	this.select_object(button, true);
}


View.prototype.do_delete_objects = function()
{
	for (var o = 0; o < this._selected_objects.length; o++)
	{
		var obj = this._selected_objects[o];
		obj.get_layer().remove_object(obj);
		/*var idx = this._objects_card.indexOf(obj);
		if (idx >= 0)
			this._objects_card.splice(idx, 1);
		idx = this._objects_bkgnd.indexOf(obj);
		if (idx >= 0)
			this._objects_bkgnd.splice(idx, 1);
		obj.kill();*/
	}
	this._selected_objects.length = 0;
	
	//this._renumber_objects();
}


View.prototype.do_delete = function()
{
	if (this._mode == View.MODE_BROWSE)
		this.do_delete_card();
	else if (this._mode == View.MODE_AUTHORING)
		this.do_delete_objects();
}


View.prototype._keep_content = function() // need to replace this for resequencing with something that will ensure object content is saved
// probably duplicate content within object - store a buffer TOO, which doubles as a mechanism for dirty flagging?
{
	/* dump the card content */
	/*var card_data = new Array(this._objects_card.length + this._objects_bkgnd.length);
	for (var o = 0; o < this._objects_card.length; o++)
		card_data[o] = [this._objects_card[o]._attrs[LayerObject.ATTR_ID],
						this._objects_card[o].get_attr(LayerObject.ATTR_CONTENT)];
	var offset = this._objects_card.length;
	for (var o = 0; o < this._objects_bkgnd.length; o++)
		card_data[o + offset] = [this._objects_bkgnd[o]._attrs[LayerObject.ATTR_ID], 
								this._objects_bkgnd[o].get_attr(LayerObject.ATTR_CONTENT)];
	this._card.content = card_data;*/
	
	
	/*
	
	
	var objects = [];
	for (var o = 0; o < this._objects_bkgnd.length; o++)
	{
		var obj = this._objects_bkgnd[o];
		if (obj.get_attr(LayerObject.ATTR_SHARED)) continue;
		
		if (obj.get_type() == Button.TYPE)
			var data = [obj.get_attr(LayerObject.ATTR_ID),
				obj.get_attr(LayerObject.ATTR_CONTENT),
				obj.get_attr(Button.ATTR_HILITE)];
		else
			var data = [obj.get_attr(LayerObject.ATTR_ID),
				obj.get_attr(LayerObject.ATTR_CONTENT)];
			
		objects.push(data);
	}
	this._card.data = JSON.stringify(objects);*/
}


View.prototype._save_defs_n_content = function()
{
	/* dump the object definitions to the card data block */
	var objects = new Array(this._objects_card.length);
	for (var o = 0; o < this._objects_card.length; o++)
		objects[o] = this._objects_card[o].get_def();
	this._card.card_object_data = JSON.stringify(objects);
	
	objects = new Array(this._objects_bkgnd.length);
	for (var o = 0; o < this._objects_bkgnd.length; o++)
		objects[o] = this._objects_bkgnd[o].get_def();
	this._card.bkgnd_object_data = JSON.stringify(objects);
	
	/* get non-shared background content */
	var objects = [];
	for (var o = 0; o < this._objects_bkgnd.length; o++)
	{
		var obj = this._objects_bkgnd[o];
		if (obj.get_attr(LayerObject.ATTR_SHARED)) continue;
		
		if (obj.get_type() == Button.TYPE)
			var data = [obj.get_attr(LayerObject.ATTR_ID),
				obj.get_attr(LayerObject.ATTR_CONTENT),
				obj.get_attr(Button.ATTR_HILITE)];
		else
			var data = [obj.get_attr(LayerObject.ATTR_ID),
				obj.get_attr(LayerObject.ATTR_CONTENT)];
			
		objects.push(data);
	}
	this._card.data = JSON.stringify(objects);
}


View.prototype._end_editing = function()
{
	if (document.activeElement)
		document.activeElement.blur();
	this.select_none();
	this.paint_keep();
}


View.prototype._save_card = function(in_handler)
{
	this._end_editing();
	
	this._card.save(function(in_success, in_view)
	{
		if (in_success)
			in_view._bkgnd.save(function(in_success, in_view)
			{
				if (in_success && in_handler) in_handler.call(in_view);
			},
			in_view);
	},
	this);


	//this._save_defs_n_content();
	
	/* submit ajax request to save the card */
	/*var msg = {
		cmd: 'save_card',
		stack_id: this._stack.stack_id,
		card: this._card
	};*/
	//alert(JSON.stringify(msg));
	
	/*Progress.operation_begun('Saving card...');
	Ajax.send(msg, function(msg, status) {
		var handler = in_handler;
		Progress.operation_finished();
		if ((status != 'ok') || (msg.cmd != 'save_card'))
			Alert.network_error("Couldn't save card.\n(" + status + JSON.stringify(msg) + ")");
			//alert('Save card error: '+status+"\n"+JSON.stringify(msg));
		else if (handler) handler();
	});*/
}


View.prototype._resurect = function(in_def, in_bkgnd)
{
	var id = in_def[LayerObject.ATTR_ID] * 1;
	if (id >= this._next_id) this._next_id = id + 1;
		
	var obj = null;
	if (in_def[LayerObject.ATTR_TYPE] == LayerObject.TYPE_BUTTON)
		obj = new Button(this, in_def, in_bkgnd);
	else
		obj = new Field(this, in_def, in_bkgnd);
		
	return obj;
}





View.prototype._config_art_visibility = function()
{
	if ( this._mode == View.MODE_PAINTING || (this._paint && this._paint.is_active()) )
	{
		this._layer_card_art.style.visibility = 'hidden';
		this._layer_bkgnd_art.style.visibility = (!this._edit_bkgnd ? 'visible' : 'hidden');
		this._layer_paint.style.visibility = 'visible';
	}
	else
	{
		this._layer_paint.style.visibility = 'hidden';
		this._layer_card_art.style.visibility = (this._edit_bkgnd ? 'hidden' : 'visible');
		this._layer_bkgnd_art.style.visibility = 'visible';
	}
}


View.prototype._rebuild_art = function()
{
	this._layer_bkgnd_art.innerHTML = '';
	this._layer_card_art.innerHTML = '';
	
	if (this._card.card_art)
	{
		var img = new Image();
		img.src = this._card.card_art;
		this._layer_card_art.appendChild(img);
	}
	if (this._card.bkgnd_art)
	{
		var img = new Image();
		img.src = this._card.bkgnd_art;
		this._layer_bkgnd_art.appendChild(img);
	}
	
	this._config_art_visibility();
}


View.prototype._rebuild_card = function() // will have to do separate load object data & separate reload from object lists
{
	/* dump the current card */
	this._next_id = 1;
	this._selected_objects = [];
	for (o = 0; o < this._objects_card.length; o++)
		this._objects_card[o].kill();
	this._objects_card = [];
	for (o = 0; o < this._objects_bkgnd.length; o++)
		this._objects_bkgnd[o].kill();
	this._objects_bkgnd = [];

	/* load the object definitions from the card data block */
	try
	{
		var objects = JSON.parse(this._card.bkgnd_object_data);
		this._objects_bkgnd = new Array(objects.length);
		for (var o = 0; o < objects.length; o++)
		{
			var obj = this._resurect(objects[o], true);
			//obj._is_bkgnd = true;
			this._objects_bkgnd[o] = obj;
			//this._layer_obj_card.appendChild(obj._div);
		}
	}
	catch (e) {}
	
	try {
		var objects = JSON.parse(this._card.card_object_data);
		this._objects_card = new Array(objects.length);
		for (var o = 0; o < objects.length; o++)
		{
			var obj = this._resurect(objects[o], false);
			//obj._is_bkgnd = false;
			this._objects_card[o] = obj;
			//this._layer_obj_card.appendChild(obj._div);
		}
	}
	catch (e) {}
	
	this._rebuild_layers();
	
	/* load the object content */
	/*try
	{
		var offset = this._objects_card.length;
		for (var o = 0; o < this._card.content.length; o++)
		{
			var data = this._card.content[o];
			if (o >= offset)
				this._objects_bkgnd[o - offset].set_attr(LayerObject.ATTR_CONTENT, data[1]);
			else
				this._objects_card[o].set_attr(LayerObject.ATTR_CONTENT, data[1]);
		}
	}
	catch (e) {}*/
	
	/* new content mechanism? CAN only use for card content in bkgnd fields */
	try
	{
		var objects = JSON.parse(this._card.data);
		for (var o = 0; o < objects.length; o++)
		{
			var data = objects[o];
			var obj = this._lookup_bkgnd_part_by_id(data[0]);
			if (obj) 
			{
				obj.set_attr(LayerObject.ATTR_CONTENT, data[1]);
				if (data.length == 3)
					obj.set_attr(Button.ATTR_HILITE, data[2]);
			}
		}
	}
	catch (e) {}
	
	this._renumber_objects();
	
	/* pull out the art work (if any) */
	//alert('card art: '+this._card.card_art);
	//alert('bkgnd art: '+this._card.bkgnd_art);
	
	this._rebuild_art();
	this.paint_revert();
	
	/* cause fields to be editable where appropriate */
	this._mode_changed();
}


View.prototype._lookup_bkgnd_part_by_id = function(in_part_id)
{
	for (var o = 0; o < this._objects_bkgnd.length; o++)
	{
		var obj = this._objects_bkgnd[o];
		if (obj.get_attr(LayerObject.ATTR_ID) == in_part_id)
			return obj;
	}
	return null;
}


View.prototype._load_card = function(in_card_id)
{

	/* submit ajax request to load the card */
	msg = {
		cmd: 'load_card',
		stack_id: this._stack.stack_id,
		card_id: in_card_id
	};
	
	Progress.operation_begun('Loading card...');
	var me = this;
	Ajax.send(msg, function(msg, status) {
		Progress.operation_finished();
		if ((status != 'ok') || (msg.cmd != 'load_card'))
			alert('Load card error: '+status+"\n"+JSON.stringify(msg));
		else
		{
			me._card = msg.card;
			me._rebuild_card();
		}
	});
	
	
}


View.prototype.do_new_card = function()
{
	var view = this;
	Progress.operation_begun('Creating a new card...');
	this._save_card(function()
	{
		Card.make_new(view._stack, view._card, function(in_new_card)
		{
			view._card = in_new_card;
			view._rebuild_layers();
			Progress.operation_finished();
		});
	});
}



View.prototype.do_new_bkgnd = function()
{
	var view = this;
	Progress.operation_begun('Creating a new background...');
	this._save_card(function()
	{
		Bkgnd.make_new(view._stack, view._card, function(in_new_card, in_new_bkgnd)
		{
			view._card = in_new_card;
			view._bkgnd = in_new_bkgnd;
			view._rebuild_layers();
			Progress.operation_finished();
		});
	});
}


View.prototype.do_delete_card = function()
{
	var view = this;
	this._end_editing();
	Progress.operation_begun('Deleting the card...');
	this._card.destroy(function(in_new_card, in_new_bkgnd)
	{
		view._card = in_new_card;
		view._bkgnd = in_new_bkgnd;
		view._rebuild_layers();
		Progress.operation_finished();
	});
}


View.prototype._go_nth_card = function(in_ref, in_bkgnd)
{
	var view = this;
	Progress.operation_begun('Saving the current card...');
	this._save_card(function()
	{
		Progress.status('Loading the card...');
		view._card.load_nth(in_ref, in_bkgnd, function(in_new_card, in_new_bkgnd)
		{
			if (in_new_card)
			{
				view._card = in_new_card;
				if (in_new_bkgnd) view._bkgnd = in_new_bkgnd;
				view._rebuild_layers();
			}
			Progress.operation_finished();
		});
	});
}


View.prototype.go_first = function()
{
	this._go_nth_card('#1');
}

View.prototype.go_prev = function()
{
	this._go_nth_card('#previous');
}

View.prototype.go_next = function()
{
	this._go_nth_card('#next');
}

View.prototype.go_last = function()
{
	this._go_nth_card('#last');
}


View.prototype.refresh = function()
{
	this._rebuild_card();
	
	

	//alert(JSON.stringify(this._card));
}


View.prototype._do_button_info = function()
{
	var button = View.current.get_current_object(true);

	Dialog.ButtonInfo.populate_with(button);
	Dialog.ButtonInfo.element('bkgnd-only').style.visibility = (button.is_bkgnd() ? 'visible' : 'hidden');
	
	Dialog.ButtonInfo.set_onclose(function(in_dialog, in_save)
	{
		in_dialog.element('bkgnd-only').style.visibility = 'hidden';
		if (in_save) 
		{
			in_dialog.apply();
			View.current.rebuild(); // this should happen automatically in future **TODO**
		}
	});
	Dialog.ButtonInfo.show();
}


View.prototype._do_field_info = function()
{
	var field = View.current.get_current_object(true);

	Dialog.FieldInfo.populate_with(field);
	Dialog.FieldInfo.element('bkgnd-only').style.visibility = (field.is_bkgnd() ? 'visible' : 'hidden');
	
	Dialog.FieldInfo.set_onclose(function(in_dialog, in_save)
	{
		in_dialog.element('bkgnd-only').style.visibility = 'hidden';
		if (in_save) 
		{
			in_dialog.apply();
			View.current.rebuild(); // this should happen automatically in future **TODO**
		}
	});
	Dialog.FieldInfo.show();
	
	/*
	var obj = this._selected_objects[0];
	Application._objects = this._selected_objects;
	
	document.getElementById('FieldInfoName').value = obj.get_attr(LayerObject.ATTR_NAME);
	document.getElementById('FieldInfoNumber').textContent = 
		(obj._is_bkgnd ? 'Bkgnd' : 'Card') + ' field number: ' + obj.get_attr(LayerObject.ATTR_KLAS_NUM);
	document.getElementById('FieldInfoID').textContent = 
		(obj._is_bkgnd ? 'Bkgnd' : 'Card') + ' field ID: ' + obj.get_attr(LayerObject.ATTR_ID);
	
	document.getElementById('FieldInfoBorder').checked = obj.get_attr(Field.ATTR_BORDER);
	document.getElementById('FieldInfoShadow').checked = obj.get_attr(LayerObject.ATTR_SHADOW);
	document.getElementById('FieldInfoOpaque').checked = (obj.get_attr(LayerObject.ATTR_COLOR) != null);
	document.getElementById('FieldInfoScrolling').checked = obj.get_attr(Field.ATTR_SCROLL);
	
	document.getElementById('FieldInfoShowLines').checked = obj.get_attr(Field.ATTR_SHOW_LINES);
	document.getElementById('FieldInfoWideMargins').checked = obj.get_attr(Field.ATTR_WIDE_MARGINS);
	document.getElementById('FieldInfoLocked').checked = obj.get_attr(Field.ATTR_LOCKED);
	document.getElementById('FieldInfoDontWrap').checked = obj.get_attr(Field.ATTR_DONT_WRAP);
	document.getElementById('FieldInfoAutoTab').checked = obj.get_attr(Field.ATTR_AUTO_TAB);

	document.getElementById('FieldInfoBkgndOnly').style.visibility = (obj._is_bkgnd ? 'visible' : 'hidden');
	document.getElementById('FieldInfoShared').checked = obj.get_attr(LayerObject.ATTR_SHARED);
	document.getElementById('FieldInfoDontSearch').checked = ! obj.get_attr(LayerObject.ATTR_SEARCHABLE);
	
	document.getElementById('FieldInfoAutoSelect').checked = obj.get_attr(Field.ATTR_AUTO_SELECT);
	document.getElementById('FieldInfoMultipleLines').checked = obj.get_attr(Field.ATTR_MULTIPLE_LINES);
	
	Dialog.FieldInfo.show();*/
}


View.prototype._save_field_info = function()
{
	var obj = this._selected_objects[0];
	
	obj.set_attr(LayerObject.ATTR_NAME, document.getElementById('FieldInfoName').value);
	
	obj.set_attr(Field.ATTR_BORDER, document.getElementById('FieldInfoBorder').checked);
	obj.set_attr(LayerObject.ATTR_SHADOW, document.getElementById('FieldInfoShadow').checked);
	obj.set_attr(LayerObject.ATTR_COLOR, (document.getElementById('FieldInfoOpaque').checked ? [1,1,1] : null));
	obj.set_attr(Field.ATTR_SCROLL, document.getElementById('FieldInfoScrolling').checked);
	
	obj.set_attr(Field.ATTR_SHOW_LINES, document.getElementById('FieldInfoShowLines').checked);
	obj.set_attr(Field.ATTR_WIDE_MARGINS, document.getElementById('FieldInfoWideMargins').checked);
	obj.set_attr(Field.ATTR_LOCKED, document.getElementById('FieldInfoLocked').checked);
	obj.set_attr(Field.ATTR_DONT_WRAP, document.getElementById('FieldInfoDontWrap').checked);
	obj.set_attr(Field.ATTR_AUTO_TAB, document.getElementById('FieldInfoAutoTab').checked);

	obj.set_attr(LayerObject.ATTR_SHARED, document.getElementById('FieldInfoShared').checked);
	obj.set_attr(LayerObject.ATTR_SEARCHABLE, ! document.getElementById('FieldInfoDontSearch').checked);
	
	obj.set_attr(Field.ATTR_AUTO_SELECT, document.getElementById('FieldInfoAutoSelect').checked);
	obj.set_attr(Field.ATTR_MULTIPLE_LINES, document.getElementById('FieldInfoMultipleLines').checked);
	
	Dialog.dismiss();
}


View.prototype._count_klass = function(in_table, in_klass)
{
	var count = 0;
	for (var o = 0; o < in_table.length; o++)
		if (in_table[o].get_type() == in_klass) count++;
	return count;
}


View.prototype._do_card_info = function()
{
	Dialog.CardInfo.populate_with(this._card);
	Dialog.CardInfo.set_onclose(function(in_save)
	{
		if (in_save) Dialog.CardInfo.apply();
	});
	Dialog.CardInfo.show();
}


View.prototype._do_bkgnd_info = function()
{
	Dialog.BkgndInfo.populate_with(this._bkgnd);
	Dialog.BkgndInfo.set_onclose(function(in_save)
	{
		if (in_save) Dialog.BkgndInfo.apply();
	});
	Dialog.BkgndInfo.show();
}



View.prototype.do_info = function()
{
	this.set_current_object(null);

	if (this._selected_objects.length == 1)
	{
		if (this._selected_objects[0].get_type() == Button.TYPE)
			this._do_button_info();
		else
			this._do_field_info();
	}
	else if (!this._edit_bkgnd)
		this._do_card_info();
	else
		this._do_bkgnd_info();
}


View.save_info = function()
{
	var view = View.current;
	if (view._selected_objects.length == 1)
	{
		if (view._selected_objects[0].get_type() == Button.TYPE)
			view._save_button_info();
		else
			view._save_field_info();
	}
	/*else if (!view._edit_bkgnd)
		view._save_card_info();
	else
		view._save_bkgnd_info();*/
}


// ie. go through and build a list of the selection in the actual current relative number order,
// as well as the current index within their respective layer table,
// then can remove one at a time from the top down, and put in the new location,
// and offset the remaining indexes as appropriate

View.prototype._enumerate_in_sequence = function()
{
	var bkgnd_list = [];
	for (var o = 0; o < this._objects_bkgnd.length; o++)
	{
		var obj = this._objects_bkgnd[o];
		if (obj._selected)
			bkgnd_list.push({ obj: obj, num: obj.get_attr(LayerObject.ATTR_PART_NUM), idx: o });
	}
	var card_list = [];
	for (var o = 0; o < this._objects_card.length; o++)
	{
		var obj = this._objects_card[o];
		if (obj._selected)
			card_list.push({ obj: obj, num: obj.get_attr(LayerObject.ATTR_PART_NUM), idx: o });
	}
	return { card: card_list, bkgnd: bkgnd_list };
}


View.prototype.send_to_front = function()
{
	if (this._selected_objects.length == 0) return;
	
	var lists = this._enumerate_in_sequence();
	
	for (var o = lists.card.length - 1; o >= 0; o--)
	{
		var item = lists.card[o];
		var obj = this._objects_card.splice(item.idx, 1)[0];
		this._objects_card.push(obj);
	}
	
	this._renumber_objects();
	
	this._save_defs_n_content();
	this._rebuild_layers();
}


View.prototype.send_forward = function()
{
	if (this._selected_objects.length == 0) return;
	
	var lists = this._enumerate_in_sequence();
	
	for (var o = lists.card.length - 1; o >= 0; o--)
	{
		var item = lists.card[o];
		if (item.idx >= this._objects_card.length - 1) return;
		var obj = this._objects_card.splice(item.idx, 1)[0];
		this._objects_card.splice(item.idx + 1, 0, obj);
	}
	
	this._renumber_objects();
	
	this._save_defs_n_content();
	this._rebuild_layers();
}


View.prototype.send_backward = function()
{
	if (this._selected_objects.length == 0) return;
	
	var lists = this._enumerate_in_sequence();
	
	for (var o = 0; o < lists.card.length; o++)
	{
		var item = lists.card[o];
		if (item.idx < 1) return;
		var obj = this._objects_card.splice(item.idx, 1)[0];
		this._objects_card.splice(item.idx - 1, 0, obj);
	}
	
	this._renumber_objects();
	
	this._save_defs_n_content();
	this._rebuild_layers();
}


View.prototype.send_to_back = function()
{
	if (this._selected_objects.length == 0) return;
	
	var lists = this._enumerate_in_sequence();
	
	var nidx = 0;
	for (var o = 0; o < lists.card.length; o++)
	{
		var item = lists.card[o];
		var obj = this._objects_card.splice(item.idx, 1)[0];
		this._objects_card.splice(nidx ++, 0, obj);
	}
	
	this._renumber_objects();
	
	this._save_defs_n_content();
	this._rebuild_layers();
}
///ScriptEditorObject



View.prototype._save_stack = function()
{
	Progress.operation_begun('Saving stack...');
	var msg = {
		cmd: 'save_stack',
		stack_id: this._stack.stack_id,
		stack: this._stack
	};
	Ajax.send(msg, function(msg, status)
	{
		Progress.operation_finished();
		if ((status != 'ok') || (msg.cmd != 'save_stack'))
			Alert.network_error("Couldn't save stack. \n" + status + "; " + JSON.stringify(msg));
		else
			this._stack = msg.stack;
	});
}







View.prototype.paint_keep = function()
{
	if (!this._paint) return;
	if (!this._paint.is_active()) return;
	
	if (!this._edit_bkgnd)
		this._card.card_art = this._paint.get_data_png();
	else
		this._card.bkgnd_art = this._paint.get_data_png();
}


View.prototype.paint_revert = function()
{
	if (!this._paint) return;
	if (!this._paint.is_active()) return;
	
	if (!this._edit_bkgnd)
		this._paint.set_data_png(this._card.card_art);
	else
		this._paint.set_data_png(this._card.bkgnd_art);
}



View.do_link_to = function()
{
	// really need an expression here, because can't save the runtime object ***
	// will need xTalk integrated to do this properly
	//this._link_from_object = this._selected_objects[0]; 
	
	Palette.LinkTo.show();
}


View.do_effect = function()
{
	
	Dialog.Effect.show();
}


View.apply_link_to = function(in_subject)
{
	Palette.LinkTo.hide();
	
}


View.apply_effect = function()
{
	Dialog.dismiss();
}



View.get_stack_icons = function()
{
	return View.current._stack.stack_icons;
}


View.register_icon = function(in_id, in_name, in_data)
{
	var icon_def = [in_id, in_name, in_data];
	View.current._stack.stack_icons.push(icon_def);
	View.current._icon_index[in_id] = icon_def;
}


View.prototype._index_icons = function()
{
return;
// **TO REVISE **
	this._icon_index = {};
	for (var i = 0; i < this._stack.stack_icons.length; i++)
	{
		this._icon_index[this._stack.stack_icons[i][0]] = this._stack.stack_icons[i];
	}
}


View.do_share = function()
{
	var rt = document.getElementById('ShareButton').getBoundingClientRect();
	PopupMenu.ShareMenu.show([rt.left, rt.top, rt.right, rt.bottom]);
}


View.do_print_card = function()
{
	alert('Print card not yet implemented.');
}


View.do_save = function()
{
	View.current._save_card(null);
}



View.do_protect_stack = function()
{
	var stack = View.current._stack;
	
	document.getElementById('ProtectStackCantModify').checked = stack.get_attr('cant_modify');
	document.getElementById('ProtectStackCantDelete').checked = stack.get_attr('cant_delete');
	document.getElementById('ProtectStackCantAbort').checked = stack.get_attr('cant_abort');
	document.getElementById('ProtectStackCantPeek').checked = stack.get_attr('cant_peek');
	document.getElementById('ProtectStackPrivateAccess').checked = stack.get_attr('private_access');
	document.getElementById('ProtectStackUserLevel' + stack.get_attr('user_level')).checked = true;

	Dialog.ProtectStack.show();
}


// probably need to make sure these changes only go through if a cookie is first
// obtained from the server, which has a built-in timeout
// thus, we can ensure the client application actually knows the password, ie.
// has solicited it from the user

View.save_protect_stack = function()
{
	var stack = View.current._stack;

	Dialog.dismiss();
	
	stack.set_attr('cant_modify', document.getElementById('ProtectStackCantModify').checked);
	stack.set_attr('cant_delete', document.getElementById('ProtectStackCantDelete').checked);
	stack.set_attr('cant_abort', document.getElementById('ProtectStackCantAbort').checked);
	stack.set_attr('cant_peek', document.getElementById('ProtectStackCantPeek').checked);
	stack.set_attr('private_access', document.getElementById('ProtectStackPrivateAccess').checked);
	
	var ul = 5;
	if (document.getElementById('ProtectStackUserLevel1').checked) ul = 1;
	else if (document.getElementById('ProtectStackUserLevel2').checked) ul = 2;
	else if (document.getElementById('ProtectStackUserLevel3').checked) ul = 3;
	else if (document.getElementById('ProtectStackUserLevel4').checked) ul = 4;
	stack.set_attr('user_level', ul);
	
	Progress.operation_begun('Applying stack protection options...');
	stack.save(Progress.operation_finished);
}


View.do_set_password = function()
{
	document.getElementById('SetPasswordFirst').value = '';
	document.getElementById('SetPasswordSecond').value = '';
	Dialog.SetPassword.show();
}


View._do_set_password = function()
{
	var pw1 = document.getElementById('SetPasswordFirst').value;
	var pw2 = document.getElementById('SetPasswordSecond').value;
	if (pw1 != pw2)
	{
		var alert = new Alert();
		alert.icon = Alert.ICON_WARNING;
		alert.prompt = "Sorry, passwords don't match.";
		alert.button1_label = 'OK';
		alert.button1_handler = function()
		{
			document.getElementById('SetPasswordFirst').selectionStart = 0;
			document.getElementById('SetPasswordFirst').selectionEnd = pw1.length;
			document.getElementById('SetPasswordFirst').focus();
		};
		alert.show();
	}
	else
	{
		Dialog.dismiss();
		Progress.operation_begun('Setting stack password...');
		View.current._stack.set_password(pw1, Progress.operation_finished);
	}
}


View.clear_password = function()
{
	Progress.operation_begun('Removing stack password...');
	View.current._stack.set_password(null, Progress.operation_finished);
}




View.do_stack_info = function()
{
	var stack = View.current._stack;
	View.current.set_current_object(stack);
	
	document.getElementById('StackInfoName').value = stack.get_attr('name');
	document.getElementById('StackInfoWhere').innerHTML = 'Where: '+stack.get_attr('path');
	
	document.getElementById('StackInfoCardCount').innerHTML = 'Stack contains '+
		Util.plural(stack.get_attr('count_cards'), 'card', 'cards')+'.';
	document.getElementById('StackInfoBkgndCount').innerHTML = 'Stack contains '+
		Util.plural(stack.get_attr('count_bkgnds'), 'background', 'backgrounds')+'.';
	
	document.getElementById('StackInfoSize').innerHTML = 'Size of stack: ' + 
		Util.human_size(stack.get_attr('size'));
	document.getElementById('StackInfoFree').innerHTML = 'Free in stack: ' + 
		Util.human_size(stack.get_attr('free'));
	
	document.getElementById('StackInfoCardSize').innerHTML = 'Card size: ' +
		stack.get_card_size_text();

	
	Dialog.StackInfo.show();
}


// not currently particularly relevant **
View.save_stack_info = function()
{
	Dialog.dismiss();
	/*var do_rename = false;
	if (this._stack.stack_name != document.getElementById('StackInfoName').value)
		do_rename = true;	
	this._stack.stack_name = document.getElementById('StackInfoName').value;
	Dialog.dismiss();
	
	if (do_rename)
	{
		Progress.operation_begun('Renaming Stack...');
		var msg = {
			cmd: 'rename_stack',
			stack_id: this._stack.stack_id
		};
		Ajax.send(msg, function(msg, status)
		{
			Progress.operation_finished();
			if ((status != 'ok') || (msg.cmd != 'load_card'))
				alert('Rename stack error: '+status+"\n"+JSON.stringify(msg));
			else
				this._stack = msg.stack;
		});
	}*/
}



View.compact = function()
{
	Progress.operation_begun('Compacting this stack...', true);
	View.current._stack.compact( Progress.operation_finished );
}



View.prototype.get_stack = function()
{
	return this._stack;
}



View.prototype.get_current_object = function(in_multiple_error)
{
	if (this._current_object)
		return this._current_object;
	else if (this._selected_objects.length > 1)
	{
		if (in_multiple_error)
		{
			var alert = new Alert();
			alert.title = 'Multiple Objects Selected';
			alert.prompt = 'That operation cannot be performed with multiple objects selected.';
			alert.button1_label = 'OK';
			alert.show();
		}
		return null;
	}
	else if (this._selected_objects.length == 1)
		return this._selected_objects[0];
	else if (!this._edit_bkgnd)
		return this._card;
	else
		return this._bkgnd;
}


View.prototype.get_current_objects = function()
{
	if (this._current_object)
		return  [ this._current_object ];
	else if (this._selected_objects.length > 0)
		return this._selected_objects;
	else if (!this._edit_bkgnd)
		return this._card;
	else
		return this._bkgnd;
}


/*
	Temporarily overrides whatever the selection is within the view.
	Enables editing of objects beyond the view which is usually responsible for
	the editing process.
	
	Specifying null allows the selection (if any) to preside again.
	When card is reloaded, selection changed or edit background mode is changed,
	any override is cleared automatically.
*/
View.prototype.set_current_object = function(in_another_object)
{
	if (in_another_object)
		this.select_none();
	this._current_object = in_another_object;
}



View.do_edit_script = function(in_prior)
{
	var object = View.current.get_current_object(true);
	if (!object) return;
	
	document.getElementById('ScriptEditorObject').textContent = object.get_description();
	var script = object.get_attr('script');
	
	var sel_pos = 0;
	if (object.get_type() == Button.TYPE && script == 'on mouseup\n  \nend mouseup')
		sel_pos = 13;
		
	Dialog.ScriptEditor._codeeditor.set_script(script, sel_pos);
	
	if (in_prior) in_prior();
	Dialog.ScriptEditor.show();
	Dialog.ScriptEditor._codeeditor.focus();
	
	Dialog.ScriptEditor.set_onclose(function(in_dialog, in_save) 
	{
		if (!in_save) return;
		var object = View.current.get_current_object(false);
		object.set_attr('script', in_dialog._codeeditor.get_script());
	});
}




/*

	var view = View.current;
	
	var desc_label = document.getElementById('ScriptEditorObject');
	var curr_script = null;
	
	var is_btn = false;
	
	if (in_subject == View.CURRENT_OBJECT) 
	{
		Dialog.ScriptEditor._object = view._selected_objects[0];
		var obj = Dialog.ScriptEditor._object;
		var id = obj.get_attr(LayerObject.ATTR_ID);
		var name = obj.get_attr(LayerObject.ATTR_NAME);
		var layer = (obj._is_bkgnd ? 'background' : 'card');
		
		if (obj.get_type() == Button.TYPE)
		{
			Dialog.ScriptEditor._type = View.CURRENT_BUTTON;
			desc_label.textContent = 'Script of '+layer+' button ID '+id+
				(name != '' ? ' "'+name+'"' : '');
			is_btn = true;
		}
		else
		{
			Dialog.ScriptEditor._type = View.CURRENT_FIELD;
			desc_label.textContent = 'Script of '+layer+' field ID '+id+
				(name != '' ? ' "'+name+'"' : '');
		}
		
		curr_script = obj.get_attr(LayerObject.ATTR_SCRIPT);
		Dialog.ScriptEditor._edit_type = 'object';
	}
	else if (in_subject == View.CURRENT_STACK)
	{
		Dialog.ScriptEditor._object = view._stack;
		Dialog.ScriptEditor._type = View.CURRENT_STACK;
		desc_label.textContent = 'Script of '+view._stack.get_text_desc();
		
		curr_script = view._stack.get_attr('script');
		Dialog.ScriptEditor._edit_type = 'stack';
	}
	else if (in_subject == View.CURRENT_BKGND) 
	{
		Dialog.ScriptEditor._object = view._card;
		Dialog.ScriptEditor._type = View.CURRENT_BKGND;
		desc_label.textContent = 'Script of background ID '+view._card.bkgnd_id+
			(view._card.bkgnd_name != '' ? ' "'+view._card.bkgnd_name+'"' : '');
			
		curr_script = view._card.bkgnd_script;
		Dialog.ScriptEditor._edit_type = 'bkgnd';
	}
	else if (in_subject == View.CURRENT_CARD)
	{
		Dialog.ScriptEditor._object = view._card;
		Dialog.ScriptEditor._type = View.CURRENT_CARD;
		desc_label.textContent = 'Script of '+view._card.get_text_desc();
		
		curr_script = view._card.card_script;
		Dialog.ScriptEditor._edit_type = 'card';
	}
	*/






CinsImp._script_loaded('view');


