/*
CinsImp
Data Model: Background

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
	Background always takes a definition object, since it is always obtained by accessing
	a specific card, and returned within the same request.
*/
Model.Bkgnd = function(in_stack, in_def, in_ready_handler, in_view)
{
	Layer.call(this, in_stack, in_def, in_ready_handler, in_view);
};
var Bkgnd = Model.Bkgnd;
Bkgnd.TYPE = 'bkgnd';
Util.classInheritsFrom(Bkgnd, Model.Layer);


Bkgnd.prototype.get_type = function() { return Bkgnd.TYPE; }
Bkgnd.prototype.get_name = function() { return 'Background'; }


Bkgnd.prototype._get_attr = function(in_attr, in_value, in_fmt)
{
	if (in_attr == 'count_cards' && in_fmt == 'ui')
		return Util.plural(in_value, 'card', 'cards');
	else if (in_attr == 'count_buttons' && in_fmt == 'ui')
		return Util.plural(in_value, 'button', 'buttons');
	else if (in_attr == 'count_fields' && in_fmt == 'ui')
		return Util.plural(in_value, 'field', 'fields');
	
	return undefined;
}


Bkgnd.prototype._attr_writable = function(in_attr)
{
	switch (in_attr)
	{
	case 'script':
	case 'cant_delete':
	case 'dont_search':
	case 'name':
	case 'art':
		return true;
	default:
		return false;
	}
}


Bkgnd.make_new = function(in_stack, in_preceeding, in_onfinished)
{
	if (typeof in_preceeding == 'object')
		in_preceeding = in_preceeding._def.id;
	
	in_stack.gateway(
	{
		cmd: 'new_bkgnd',
		card_id: in_preceeding
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






CinsImp._script_loaded('Model.Bkgnd');


