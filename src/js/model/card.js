/*
CinsImp
Data Model: Card

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

var CinsImp = CinsImp || {};
CinsImp.Model = CinsImp.Model || {};

var Model = CinsImp.Model;


/*
	Client-side representation of a loaded Background.
	
	in_stack must be a Model.Stack object.
	Card expects either a card ID, a card number, an ordinal, a name, or a card 
	definition object as the second argument.  Number should be prefixed with #.
*/
Model.Card = function(in_stack, in_ident, in_ready_handler)
{
	/* initialise the class internals */
	this._ready = false;
	this._ready_handler = in_ready_handler;
	this._stack = in_stack;
	
	this._changes = {};
	this._next_id = 1;
	this._objects = [];
	
	/* check if the identifier is not a definition;
	the definition will need to be fetched before the card can be loaded */
	if (typeof in_ident != 'object')
	{
		this._fetch_def(in_ident);
		return;
	}
	
	/* otherwise, just load the background from the definition */
	this._load_def(in_ident);
};
var Card = Model.Card;

Card.TYPE = 'card';


Card.prototype.get_type = function()
{
	return Card.TYPE;
}


/*
	Fetches the definition object for the Card from the server.
*/
Card.prototype._fetch_def = function(in_ident)
{
	var card = this;
	this._stack.gateway(
	{
		cmd: 'load_card',
		id: in_ident	
	},
	function(in_reply)
	{
		if (in_reply.cmd != 'error')
		{
			card._load_def(in_reply.card);
			card._bkgnd = new Model.Bkgnd(in_reply.bkgnd);
		}
		else card._notify_set_ready(false);
	});
}


/*
	Flags the Card object as ready to service local application requests.
*/
Card.prototype._notify_set_ready = function(in_ready)
{
	this._ready = in_ready;
	if (this._ready_handler) this._ready_handler(this, in_ready);
	this._ready_handler = null;
}


/*
	Loads the Bkgnd definition obtained from a gateway server.
*/
Card.prototype._load_def = function(in_def)
{
	this._def = in_def;
	
	for (var o = 0; o < in_def.objects.length; o++)
	{
		var obj_def = in_def.objects[o];
		var obj = null;
		if (obj_def.type == Button.TYPE)
			var obj = new CinsImp.Model.Button(obj_def, this);
		else if (obj_def.type == Field.TYPE)
			var obj = new CinsImp.Model.Field(obj_def, this);
	}
	
	/*for (var c = 0; c < in_def.content.length; c++)
	{
		var content_def = in_def.content[c];
		
	}
	*/
	/* we should check the definition is valid here */ /// ** TODO **
	
	this._def.count_fields = 0;
	this._def.count_buttons = 0;// ** TODO ** need to be calculated initially, and maintained during edits
	
	this._notify_set_ready(true);
}


Card.prototype.get_def = function(in_changes)
{
	if (this._changes.length == 0) return this._def;
	
	if ('objects' in this._changes)
	{
		var objects = [];
		for (var o = 0; o < this._objects.length; o++)
		{
			var obj = this._objects[o];
			objects.push(obj.get_def());
		}
		this._changes['objects'] = objects;
	}
	
	return this._changes;
}



Card.prototype.get_description = function()
{
	var desc = 'card ID ' + this.get_attr('id');
	var name = this.get_attr('name');
	if (name != '')
		desc += ' "' + name + '"';
	return desc;
}



Card.prototype.get_attr = function(in_attr, in_fmt)
{
	if (!(in_attr in this._def))
		throw Error('Card doesn\'t have an '+in_attr+' attribute.');

	var value = null;
	if (in_attr in this._changes) value = this._changes[in_attr];
	else value = this._def[in_attr];
	
	if (in_attr == 'seq' && in_fmt == 'ui')
		value = Util.string('^0 out of ^1', value, this._stack.get_attr('count_cards'));
	else if (in_attr == 'count_buttons' && in_fmt == 'ui')
		value = Util.plural(value, 'button', 'buttons');
	else if (in_attr == 'count_fields' && in_fmt == 'ui')
		value = Util.plural(value, 'field', 'fields');
	
	return value;
}


Card.prototype.set_attr = function(in_attr, in_value)
{
	switch (in_attr)
	{
	case 'script':
	case 'cant_delete':
	case 'dont_search':
	case 'marked':
	case 'name':
	case 'art':
		this._changes[in_attr] = in_value;
		break;
	default:
		throw new Error('Cannot set '+in_attr+' attribute of card');
	}
}


Card.prototype.apply_changes = function()
{
	for (var key in this._changes)
		this._def[key] = this._changes[key];
	this._changes = {};
}


Card.prototype.save = function(in_onfinished, in_arg)
{
	var card = this;
	this._changes['id'] = this._def.id;
	this._stack.gateway(
	{
		cmd: 'save_card',
		ref: this._def.id,
		card: this.get_def()
	}, 
	function(in_reply) 
	{
		if (in_reply.cmd != 'error') card.apply_changes();
		if (in_onfinished) in_onfinished(in_reply.cmd != 'error', in_arg);
	});
}


Card.prototype.dirty_objects = function()
{
	this._changes['objects'] = null;
}


Card.prototype.get_card_content = function(in_id)
{
	var existing = this._def['content'];
	for (var i = 0; i < existing.length; i++)
	{
		if (existing[i][0] == in_id)
		{
			return existing[i][1];
		}
	}
	return null;
}


Card.prototype.set_card_content = function(in_id, in_content)
{
	this._changes['content'] = this._def['content'];
	
	var existing = this._def['content'];
	for (var i = 0; i < existing.length; i++)
	{
		if (existing[i][0] == in_id)
		{
			existing[i][1] = in_content;
			return;
		}
	}
	existing.push([in_id, in_content]);
}


Card.prototype.generate_object_id = function()
{
	return this._next_id ++;
}


Card.prototype.add_object = function(in_object)
{
	this._objects.push(in_object);
	this.dirty_objects();
}


Card.prototype.remove_object = function(in_object)
{
	var idx = this._objects.indexOf(in_object);
	if (idx < 0) throw new Error('Can\'t remove object from layer, as it isn\'t on the layer');
	
	this._objects.splice(idx, 1);
	in_object.kill();
	
	this.dirty_objects();
}
/*var idx = this._objects_card.indexOf(obj);
		if (idx >= 0)
			this._objects_card.splice(idx, 1);
		idx = this._objects_bkgnd.indexOf(obj);
		if (idx >= 0)
			this._objects_bkgnd.splice(idx, 1);
		obj.kill();
		
		
		this._selected_objects.length = 0;
	
	//this._renumber_objects();
	*/


Card.prototype.get_objects = function()
{
	return this._objects;
}


Card.prototype.get_stack = function()
{
	return this._stack;
}


Card.make_new = function(in_stack, in_preceeding, in_onfinished)
{
	if (typeof in_preceeding == 'object')
		in_preceeding = in_preceeding._def.id;
	
	in_stack.gateway(
	{
		cmd: 'new_card',
		card_id: in_preceeding
	},
	function(in_reply)
	{
		if (in_reply.cmd != 'error')
		{
			if (in_onfinished) in_onfinished(new CinsImp.Model.Card(in_stack, in_reply.card));
		}
		else
		{
			if (in_onfinished) in_onfinished(null);
		}
	});
}


Card.destroy = function(in_stack, in_card, in_onfinished)
{
	if (typeof in_card == 'object')
		in_card = in_card._def.id;
	
	in_stack.gateway(
	{
		cmd: 'delete_card',
		card_id: in_card
	},
	function(in_reply)
	{
		if (in_reply.cmd != 'error')
		{
			if (in_onfinished) in_onfinished(
				new CinsImp.Model.Card(in_stack, in_reply.card),
				new CinsImp.Model.Bkgnd(in_stack, in_reply.bkgnd)
			);
		}
		else
		{
			if (in_onfinished) in_onfinished(null);
		}
	});
}


Card.prototype.destroy = function(in_onfinished)
{
	Card.destroy(this._stack, this, in_onfinished);
}


Card.load_nth = function(in_stack, in_ref, in_bkgnd, in_onfinished, in_existing_card)
{
	if (in_existing_card !== null && typeof in_existing_card == 'object')
		in_existing_card = in_existing_card._def.id;
	if (in_bkgnd !== null && typeof in_bkgnd == 'object')
		in_bkgnd = in_bkgnd._def.id;
	
	var msg = 
	{
		cmd: 'load_card',
		ref: in_ref
	};
	if (in_existing_card !== null) msg.current = in_existing_card;
	if (in_bkgnd !== null) msg.bkgnd_id = in_bkgnd;
	
	in_stack.gateway(msg,
	function(in_reply)
	{
		if (in_reply.cmd != 'error')
		{
			if (in_onfinished) in_onfinished(
				new CinsImp.Model.Card(in_stack, in_reply.card),
				(in_reply.bkgnd ? new CinsImp.Model.Bkgnd(in_stack, in_reply.bkgnd) : null)
			);
		}
		else
		{
			if (in_onfinished) in_onfinished(null, null);
		}
	});
}


Card.prototype.load_nth = function(in_ref, in_bkgnd, in_onfinished)
{
	Card.load_nth(this._stack, in_ref, in_bkgnd, in_onfinished, this);
}


Card.prototype.is_dirty = function()
{
	return false;
}


CinsImp._script_loaded('Model.Card');

