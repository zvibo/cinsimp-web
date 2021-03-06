/*
CinsImp
xTalk Debugging Tools

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

// need to always provide a text value for tokens, or a description effectively
// perhaps a description would be better?


Xtalk.Debug = {


	_lookup: function(in_prefix, in_id)
	{
		for (var prop_name in Xtalk)
		{
			if ((prop_name.substr(0, in_prefix.length + 1) == (in_prefix.toUpperCase()+'_')) && 
					(Xtalk[prop_name] == in_id))
				return prop_name;
		}
		return '??';
	},
	
	
	_lookup_expr: function(in_prefix, in_id)
	{
		for (var prop_name in Xtalk.Parser.Expression)
		{
			if ((prop_name.substr(0, in_prefix.length + 1) == (in_prefix.toUpperCase()+'_')) && 
					(Xtalk.Parser.Expression[prop_name] == in_id))
				return prop_name;
		}
		return '??';
	},
	

	_stringify_replacer: function(in_key, in_value)
	{
		if (in_key == 'id')
			return Xtalk.Debug._lookup('id', in_value);
		else if (in_key == 'abort')
			return Xtalk.Debug._lookup('abort', in_value);
		else if (in_key == 'loop')
			return Xtalk.Debug._lookup('loop', in_value);
		else if (in_key == 'ref')
			return Xtalk.Debug._lookup_expr('_ref', in_value);
		else
			return in_value;
	},
	
	
	debug_subtree: function(in_subtree)
	{
		return JSON.stringify(in_subtree, this._stringify_replacer, 4);
	},
	
	
	_lookup_bnf: function(in_prefix, in_id)
	{
		for (var prop_name in Xtalk.Parser.BNF)
		{
			if ((prop_name.substr(0, in_prefix.length + 1) == (in_prefix.toUpperCase()+'_')) && 
					(Xtalk.Parser.BNF[prop_name] == in_id))
				return prop_name;
		}
		return '??';
	},
	
	_bnf_replacer: function(in_key, in_value)
	{
		if (in_key == 'bnf')
			return Xtalk.Debug._lookup_bnf('PAT', in_value);
		else
			return in_value;
	},
	
	debug_pattern: function(in_pattern)
	{
		return JSON.stringify(in_pattern, this._bnf_replacer, 4);
	}

};


CinsImp._script_loaded('xtalk-debug');

