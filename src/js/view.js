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


View.prototype._activated = function()
{
	var flags = 0;
	flags |= (this._stack.is_readonly() ? Application.FILE_STATUS_READONLY : 0);
	flags |= (this._card.is_dirty() || this._bkgnd.is_dirty() ? Application.FILE_STATUS_DIRTY : 0);
	Application.file_status(flags);
}


View.prototype._notify_dirty_changed = function()
{
	this._activated();
}


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
	this._rebuild_art();
	this._activated();
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
		
	var show_num_tags = (this._mode == View.MODE_AUTHORING);
	
	var objects = this._card.get_objects();
	for (var o = 0; o < objects.length; o++)
	{
		var obj = objects[o];
		obj.set_dom_visiblity(!this._edit_bkgnd);
		obj.set_dom_editability(this._text_editable, !this._edit_bkgnd);
		obj.set_num_tag(show_num_tags && !this._edit_bkgnd);
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
		obj.set_num_tag(show_num_tags && this._edit_bkgnd);
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


View.prototype.card = function()
{
	return View.current._card;
}


View.prototype.do_idle = function()
{
	this.rebuild();
}


View.prototype.needs_rebuild = function(in_object)
{
	this._rebuild_list.push(in_object);
}


View.prototype._rebuild_art = function()
{
	this._layer_bkgnd_art.innerHTML = '';
	this._layer_card_art.innerHTML = '';
	
	var art = this._card.get_attr('art');
	if (art)
	{
		var img = new Image();
		img.src = art;
		this._layer_card_art.appendChild(img);
	}
	var art = this._bkgnd.get_attr('art');
	if (art)
	{
		var img = new Image();
		img.src = art;
		this._layer_bkgnd_art.appendChild(img);
	}
	
	this._config_art_visibility();
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


View.prototype.rebuild = function()
{
	for (var i = 0; i < this._rebuild_list.length; i++)
		this._rebuild_list[i].rebuild_dom();
	this._rebuild_list.length = 0;
}


View.prototype._rebuild_layers = function()
{
	/* remove all DOM objects from the layer */
	while (this._layer_obj_card.children.length > 0)
		this._layer_obj_card.removeChild( this._layer_obj_card.children[0] );
	
	/* add DOM objects to the layer, background first, card second */
	var objects = this._bkgnd.get_objects();
	for (var i = 0; i < objects.length; i++)
	{
		this._layer_obj_card.appendChild( objects[i].create_dom(this) );
		objects[i].non_shared_refresh();  /* <  necessary to have non-shared fields refresh content */
	}
	var objects = this._card.get_objects();
	for (var i = 0; i < objects.length; i++)
	{
		this._layer_obj_card.appendChild( objects[i].create_dom(this) );
	}
	
	/* build the actual DOM objects as needed */
	this.rebuild();
	
	/* configure the objects appropriately to the current edit mode */
	this._configure_obj_display();
	
	/* notify the model of the view to which it is presently attached
	so we get dirty notifications from the model */
	this._card.set_view(this);
	this._bkgnd.set_view(this);
	this._notify_dirty_changed();
	
	/* notify xTalk VM of current card */
	Xtalk.VM._current_card = this._card;  // will need to find appropriate places to generate actual card change events **TODO
	// also probably need the current bkgnd to be specified separately
}


View.prototype._add_object = function(in_object)
{	
	this._layer_obj_card.appendChild( in_object.create_dom(this) );
	this.rebuild();
}


View.prototype.do_new_field = function()
{
	this.select_none();
	this.choose_tool(View.TOOL_FIELD);
	
	var field = new CinsImp.Model.Field(null, (this._edit_bkgnd ? this._bkgnd : this._card));
	this._centre_object(field);
	this._add_object(field);
	
	this.select_object(field, true);
	field.set_num_tag(true);
}


View.prototype.do_new_button = function()
{
	this.select_none();
	this.choose_tool(View.TOOL_BUTTON);
	
	var button = new CinsImp.Model.Button(null, (this._edit_bkgnd ? this._bkgnd : this._card));
	this._centre_object(button);
	this._add_object(button);
	
	this.select_object(button, true);
	button.set_num_tag(true);
}


View.prototype.do_delete_objects = function()
{
	for (var o = 0; o < this._selected_objects.length; o++)
	{
		var obj = this._selected_objects[o];
		obj.get_layer().remove_object(obj);
	}
	this._selected_objects.length = 0;
	
	this._configure_obj_display();
}


View.prototype.do_delete = function()
{
	if (this._mode == View.MODE_BROWSE)
		this.do_delete_card();
	else if (this._mode == View.MODE_AUTHORING)
		this.do_delete_objects();
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
			view._rebuild_art();
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
			if (in_new_bkgnd) view._bkgnd = in_new_bkgnd;
			view._rebuild_layers();
			view._rebuild_art();
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
		if (in_new_bkgnd) view._bkgnd = in_new_bkgnd;
		view._rebuild_layers();
		view._rebuild_art();
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
				view._rebuild_art();
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


View.prototype._rebuild_selection = function()
{
	for (var o = 0; o < this._selected_objects.length; o++)
	{
		var obj = this._selected_objects[o];
		obj._set_selected(false);
		obj._set_selected(true);
	}
}


View.prototype.send_to_front = function()
{
	this._bkgnd.send_to_front();
	this._card.send_to_front();
	this._rebuild_layers();
	this._rebuild_selection();
}


View.prototype.send_forward = function()
{
	this._bkgnd.send_forward();
	this._card.send_forward();
	this._rebuild_layers();
	this._rebuild_selection();
}


View.prototype.send_backward = function()
{
	this._bkgnd.send_backward();
	this._card.send_backward();
	this._rebuild_layers();
	this._rebuild_selection();
}


View.prototype.send_to_back = function()
{
	this._bkgnd.send_to_back();
	this._card.send_to_back();
	this._rebuild_layers();
	this._rebuild_selection();
}


View.prototype.refresh = function()
{
	this._rebuild_card();
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

/*
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
*/


View.prototype.paint_keep = function()
{
	if (!this._paint) return;
	if (!this._paint.is_active()) return;
	
	if (!this._edit_bkgnd)
		this._card.set_attr('art', this._paint.get_data_png());
	else
		this._bkgnd.set_attr('art', this._paint.get_data_png());
}


View.prototype.paint_revert = function()
{
	if (!this._paint) return;
	if (!this._paint.is_active()) return;
	
	if (!this._edit_bkgnd)
		this._paint.set_data_png(this._card.get_attr('art'));
	else
		this._paint.set_data_png(this._bkgnd.get_attr('art'));
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


/*
View.get_stack_icons = function()
{
	return View.current._stack.stack_icons;
}


View.register_icon = function(in_id, in_name, in_data)
{
	var icon_def = [in_id, in_name, in_data];
	View.current._stack.stack_icons.push(icon_def);
	View.current._icon_index[in_id] = icon_def;
}*/

/*
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
*/

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







CinsImp._script_loaded('view');


