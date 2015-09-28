/*
CinsImp
xTalk Expression Parser

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

/*

Synopsis
--------

The CinsTalk parser is split into three components:
-	Handler (handlers, if..then..else, repeat, global, exit, pass, next)
-	Command (message sends, eg. answer "Hello World!", beep 3 times and sumNumbers 5,2,1)
-	Expression (this module)

This split design is adopted to make the later two components much more easily extensible,
including by a possible future plug-in mechanism.

The Expression parser is a kind of meta-parser, which is heavily driven by a collection 
of various kinds of name that are held in a dictionary.

Specifically, it handles the parsing of:
-	string, arithmetic, logic and comparison operators
-	other operators (eg. existence and geometric)
-	property access
-	object references (eg. cards, fields, buttons, etc.)
-	constants
-	special globals
-	built-in function calls


Syntax Tree Node Structures
---------------------------
** TO DO **


Dependencies
------------

xtalk.js
lex.js
dict.js

*/

Xtalk.Parser = Xtalk.Parser || {};

Xtalk.Parser.Expression = {


/*****************************************************************************************
Constants
*/

	/* these are used to denote the type of reference node: */
	_REF_UNKNOWN: 0, 	/* type will be either name/number, based on runtime type */
	_REF_NAME: 1,		/* definitely named */
	_REF_ID: 2,			/* definitely IDd */
	_REF_RANGE: 3,		/* single object or range of objects */
	

/*****************************************************************************************
Names
*/

/*
	Returns an array of strings for the textual tokens at in_index onwards.
	Used during matching constant, property, function and object names.
*/
	_words_at: function(in_list, in_index)
	{
		var words = [];
		const SANE_MAXIMUM = 10;
		for (var w = in_index; (w < in_list.children.length) && (w-in_index < SANE_MAXIMUM); w++)
		{
			var node = in_list.children[w];
			if (node && (node.id == Xtalk.ID_IDENTIFIER) && (!(node.flags & Xtalk.FLAG_KEYWORD)))
				words.push(node.text);
			else break;
		}
		return words;
	},
	

/*
	Looks up the supplied words in the specified table (from the Dictionary).
	If an entry is found, the entry is returned and the number of words that matched is
	placed in the first element of the out_word_count array.
	
	If no entry is found, returns null.
*/
	_lookup_words: function(in_table, in_words, out_word_count)
	{
		for (var wc = in_words.length; wc > 0; wc--)
		{
			var wc_entry = in_table[wc];
			if (!wc_entry) continue;
			var entry = wc_entry[in_words.slice(0, wc).join(' ')];
			if (entry) 
			{
				out_word_count[0] = wc;
				return entry;
			}
		}
		return null;
	},


/*
	Looks for a 'the' at the specified index.  If found, returns 1 and removes 'the'
	from the stream.  Otherwise returns 0.
*/
	_strip_the: function(in_list, in_index)
	{
		if (in_index < 0) return 0;
		var node = in_list.children[in_index];
		if (node.id != Xtalk.ID_THE) return 0;
		in_list.children.splice(in_index, 1);
		return 1;
	},


/*
	Looks for an ordinal at the specified index.  If found, returns an object with the
	ordinal value and the number of words (in case it's prefixed by 'the').
	
	If the token isn't an ordinal, returns null.
*/
	_get_ordinal: function(in_list, in_index)
	{
		var token = in_list.children[in_index];
		if (!token) return null;
		if (!(token.flags & Xtalk.FLAG_ORDINAL)) return null;
		
		var ordinal = {
			id: Xtalk.ID_ORDINAL,
			value: token.id - Xtalk.ID_LAST,
			words: 1
		};
		in_list.children.splice(in_index, 1);
		
		ordinal.words += this._strip_the(in_list, in_index - 1);
		return ordinal;
	},


/*
	Parses the 'number of' operator and arguments.
*/
	_parse_number_of: function(in_list, in_index)
	{	
		var in_index = in_index - this._strip_the(in_list, in_index - 1);
		
		var words = this._words_at(in_list, in_index + 1);
		if (words.length == 0)
			Xtalk._error_syntax("Expected object.");
		
		var word_count = [ 0 ];
		var counter = this._lookup_words(Xtalk.Dict._counts, words, word_count);
		if (!counter)
			Xtalk._error_syntax("Can't get number of that.");
		
		in_list.children.splice(in_index, 2, {
			id:			Xtalk.ID_NUMBER_OF,
			map:		counter
		});
	
		return in_index;
	},


/*
	Parses a constant or read-only term.
*/
	_parse_constant: function(in_list, in_index, word_count, in_constant)
	{
		if (in_constant.type == Xtalk.Dict._CONSTANT)
		{
			// ** todo ** this should be automatically converted to an actual literal (if possible)
			// string, boolean, integer or real
			in_list.children.splice(in_index, word_count, {
				id: 		Xtalk.ID_CONSTANT,
				value: 		in_constant.value
			});
		}
		else
		{
			in_list.children.splice(in_index, word_count, {
				id: 		Xtalk.ID_CONSTANT,
				param:		in_constant.id,
				handler: 	in_constant.handler
			});
		}
	},


/*
	Parses a property.
	
	Note: Property variants (eg. short, long, etc.) are handled at the dictionary level.
*/
	_parse_property: function(in_list, in_index, word_count, in_property_map)
	{
		var in_index = in_index - this._strip_the(in_list, in_index - 1);
		
		in_list.children.splice(in_index, word_count, {
			id:			Xtalk.ID_PROPERTY,
			map:		in_property_map,
			context:	null
		});
	
		return in_index;
	},


/*
	Parses an object reference and arguments.
*/
	_parse_reference: function(in_list, in_index, word_count, in_reference_map)
	{
		var ordinal = this._get_ordinal(in_list, in_index - 1);
		if (ordinal)
			var in_index = in_index - ordinal.words;
	
		var node = {
			id:			Xtalk.ID_REFERENCE,
			map:		in_reference_map,
			ref:		this._REF_UNKNOWN,
			operand1:	null,
			operand2:	null,
			context:	null
		}
		in_list.children.splice(in_index, word_count, node);
	
		if (ordinal)
		{
			node.ref = this._REF_RANGE;
			node.operand1 = ordinal; 
			// ** this should probably be converted into an actual literal (as above) ******
		}
		else
		{
			var next = in_list.children[in_index + 1];
			
			if (next && next.id == Xtalk.ID_ID)
			{
				node.ref = this._REF_ID;
				in_list.children.splice(in_index + 1, 1);
				next = in_list.children[in_index + 1];
			}
		
			if (!next) 
				Xtalk._error_syntax("Expected object identity or range");
			node.operand1 = next;
			in_list.children.splice(in_index + 1, 1);
		
			next = in_list.children[in_index + 1];
			if (next && next.id == Xtalk.ID_TO)
			{
				node.ref = this._REF_RANGE;
				in_list.children.splice(in_index + 1, 1);
				next = in_list.children[in_index + 1];
			
				if (!next) 
					Xtalk._error_syntax("Expected end of range");
				node.operand2 = next;
				in_list.children.splice(in_index + 1, 1);
			}
		
			// @ runtime, if the by field is REF_UNKNOWN:
			// if the type of operand1 is a string, by can be assumed to be REF_NAME
			// otherwise by can be assumed to be REF_RANGE
		}
	
		return in_index;
	},


/*
	Separates the arguments to a function call.
*/
	_delineate_args: function(in_func)
	{
		var list = [];
		var current_arg = {
			id: Xtalk.ID_EXPRESSION,
			children: []
		};
		list.push(current_arg);
	
		var count = in_func.args.children.length;
		for (var i = 0; i < count; i++)
		{
			var node = in_func.args.children[0];
			if (node.id == Xtalk.ID_COMMA)
			{
				current_arg = {
					id: Xtalk.ID_EXPRESSION,
					children: []
				};
				list.push(current_arg);
				in_func.args.children.splice(0, 1);
			}
			else
			{
				current_arg.children.push( node );
				in_func.args.children.splice(0, 1);
			}
		}
		while (in_func.args.children.length > 0)
			current_arg.children.push( in_func.args.children.splice(0, 1) );
	
		in_func.args = list;
	},


/*
	Parses a function call and arguments.
*/
	_parse_function_call: function(in_list, in_index)
	{
		var func_call = {
			id:		Xtalk.ID_FUNCTION_CALL,
			name:		in_list.children[in_index].text,
			args:		in_list.children[in_index + 1]
		};
		in_list.children.splice(in_index, 2, func_call);
		this._delineate_args( func_call );
	},


/*
	Tag and identify named constructs:
	Constants, Number Of, Properties, Chunk Expressions, Object References, Function Calls

	! The sequence of construct identification is somewhat sensitive and should not
	be changed without serious consideration & discussion.
*/
	_tag_identify_names: function(in_list)
	{
		for (var n = 0; n < in_list.children.length; n++)
		{
			var node = in_list.children[n];
			if (node.id == Xtalk.ID_NUMBER_OF)
			{
				n = this._parse_number_of(in_list, n);
				continue;
			}
		
			var words = this._words_at(in_list, n);
			if (words.length > 0)
			{
				var word_count = [ 0 ];
				var constant = this._lookup_words(Xtalk.Dict._constants, words, word_count);
				if (constant)
				{
					this._parse_constant(in_list, n, word_count[0], constant);
					continue;
				}
				var property_map = this._lookup_words(Xtalk.Dict._properties, words, word_count);
				if (property_map)
				{
					this._parse_property(in_list, n, word_count[0], property_map);
					continue;
				}
				var reference_map = this._lookup_words(Xtalk.Dict._references, words, word_count);
				if (reference_map)
				{
					n = this._parse_reference(in_list, n, word_count[0], reference_map);
					continue;
				}
				continue;
			}
		
			if ((node.id == Xtalk.ID_EXPRESSION) &&
				(n > 0) && 
				(in_list.children[n-1].flags & Xtalk.FLAG_IDENTIFIER))
			{
				this._parse_function_call(in_list, n-1);
			}
		}
	},


/*
	Combines consecutive terms delimited by OF or IN
	into a single term, for which the context/subject of each term is readily identified.
*/
	_coalesce_contexts: function(in_subtree)
	{
		/* coalesce object references, properties, constants and functions with their owner/operands;
		 ie. anything separated by "OF" / "IN" is grouped to form a heirarchical structure suitable
		 for execution by the interpreter */
		for (var i = in_subtree.children.length-1; i >= 0; i--)
		{
			var keyword = in_subtree.children[i];
			if (keyword && (keyword.id == Xtalk.ID_OF || keyword.id == Xtalk.ID_IN))
			{
				var prev_node = in_subtree.children[i-1];
				if ( prev_node && ((prev_node.id == Xtalk.ID_NUMBER_OF) ||
									(prev_node.id == Xtalk.ID_REFERENCE) ||
								  (prev_node.id == Xtalk.ID_PROPERTY) ||
								   (prev_node.id == Xtalk.ID_FUNCTION_CALL) ||
								   (prev_node.id == Xtalk.ID_CONSTANT)) && i+1 < in_subtree.children.length )
				{
					var next = in_subtree.children[i+1];
					var next_plus_1 = in_subtree.children[i+2];
					if (this._is_unary_op(next))
					{
						prev_node.context = in_subtree.children.splice(i+1, 2); // might need checking 
						//next.children.push( in_subtree.children.splice(i+1, 1) );
					}
					else
						prev_node.context = in_subtree.children.splice(i+1, 1);
					in_subtree.children.splice(i, 1);
				}
				else
					Xtalk._error_syntax("Expected object, property or chunk expression.");
			}
		}
		return true;
	},



/*****************************************************************************************
Operators
*/

/*
	Returns true if the specified node represents a unary operator.
*/
	_is_unary_op: function(in_op)
	{
		if (!in_op) return false;
		if (!(in_op.flags & Xtalk.FLAG_OPERATOR)) return false;
		switch (in_op.id)
		{
			case Xtalk.ID_NEGATE:
			case Xtalk.ID_LNOT:
			case Xtalk.ID_EXISTS:
			case Xtalk.ID_NOT_EXISTS:
				return true;
			default: break;
		}
		return false;
	},


/*
	Parses a unary operator and operands.
*/
	_op_unary: function(in_stmt)
	{
		/* scan for unary operators */
		for (var i = 0; i < in_stmt.children.length; i++)
		{
			var op = in_stmt.children[i];
			if ((op.flags & Xtalk.FLAG_OPERATOR) && (!op.operand1))
			{
				if (this._is_unary_op(op))
				{
					/* found a unary operator; move the operand */
					var operand1 = in_stmt.children.splice(i+1, 1)[0];
					in_stmt.children[i] = {
						id: op.id,
						operand1: operand1
					};
					//op.operand1 = in_stmt.children.splice(i+1, 1)[0];
				}
			}
		}
	},


/*
	Parses a binary operator and operands.
*/
	_op_binary: function(in_stmt, in_ops)
	{
		/* scan for binary operators */
		for (var i = 0; i < in_stmt.children.length; i++)
		{
			var op = in_stmt.children[i];
			if ((op.flags & Xtalk.FLAG_OPERATOR) && (!op.operand1) && (!op.operand2))
			{
				for (var o = 0; o < in_ops.length; o++)
				{
					var op_id = in_ops[o];
					if (op_id == op.id)
					{
						/* found a binary operator; move the operands */
						var operand1 = in_stmt.children[i-1];
						var operand2 = in_stmt.children[i+1];
						if (operand1 && operand2)
						{
							in_stmt.children[i] = {
								id: op_id,
								operand1: operand1,
								operand2: operand2
							};

							in_stmt.children.splice(i-1,1);
							in_stmt.children.splice(i,1);
							i--;
						}
						break;
					}
				}
			}
		}
	},


	/* operator precedence: */

	_OPS_MATH_SPECIAL: Array(
		Xtalk.ID_EXPONENT
	),

	_OPS_MATH_MPYDIV: Array(
		Xtalk.ID_MULTIPLY, Xtalk.ID_DIVIDE_FP, Xtalk.ID_MODULUS, Xtalk.ID_DIVIDE_INT
	),

	_OPS_MATH_ADDSUB: Array(
		Xtalk.ID_ADD, Xtalk.ID_SUBTRACT
	),

	_OPS_STRING: Array(
		Xtalk.ID_CONCAT, Xtalk.ID_CONCAT_SPACE
	),

	_OPS_COMPREL: Array(
		Xtalk.ID_GREATER_EQ, Xtalk.ID_GREATER, Xtalk.ID_LESS_EQ, Xtalk.ID_LESSER,
		Xtalk.ID_CONTAINS, Xtalk.ID_IS_IN, Xtalk.ID_IS_NOT_IN, Xtalk.ID_IS_WITHIN, Xtalk.ID_IS_NOT_WITHIN,
		Xtalk.ID_THERE_IS_A, Xtalk.ID_THERE_IS_NO
	),

	_OPS_COMPEQ: Array(
		Xtalk.ID_EQUAL, Xtalk.ID_NOT_EQUAL
	),

	_OPS_LOGIC_AND: Array(
		Xtalk.ID_AND
	),

	_OPS_LOGIC_OR: Array(
		Xtalk.ID_OR, 0
	),


/*
	Parses operators and operands.
*/
	_operators: function(in_stmt)
	{    
		/* scan for subexpressions */
		for (var i = 0; i < in_stmt.children.length; i++)
		{
			var sexp = in_stmt.children[i];
			if (sexp && sexp.id == Xtalk.ID_EXPRESSION)
				/* parse subexpression */
				this._operators(sexp);
		}
	
		/* parse everything else in precedence order */
		this._op_unary(in_stmt);
	
		this._op_binary(in_stmt, this._OPS_MATH_SPECIAL);
		this._op_binary(in_stmt, this._OPS_MATH_MPYDIV);
		this._op_binary(in_stmt, this._OPS_MATH_ADDSUB);
		this._op_binary(in_stmt, this._OPS_STRING);
		this._op_binary(in_stmt, this._OPS_COMPREL);
		this._op_binary(in_stmt, this._OPS_COMPEQ);
		this._op_binary(in_stmt, this._OPS_LOGIC_AND);
		this._op_binary(in_stmt, this._OPS_LOGIC_OR);
	},



/*****************************************************************************************
Subexpressions
*/

/*
	Parses parenthesised subexpressions, eg. 2 * (3 + 1) to produce subtrees.
 */
	_parentheses: function(in_subtree)
	{
		var paren_level = 0;
		for (var i = 0; i < in_subtree.children.length; i++)
		{
			var child_start = in_subtree.children[i];
			if (child_start.id == Xtalk.ID_PAREN_OPEN)
			{
				/* configure this node to have children */
				child_start = {
					id: Xtalk.ID_EXPRESSION,
					children: []
				};
				in_subtree.children[i] = child_start;
				//child_start.children = [];
			
				/* find the matching closing parenthesis */
				paren_level = 0;
				var found_it = false;
				while (i+1 < in_subtree.children.length)
				{
					/* grab this node and remove it from the token stream */
					var child_end = in_subtree.children[i+1];
					in_subtree.children.splice(i+1, 1);
				
					/* track opening parenthesis */
					if (child_end.id == Xtalk.ID_PAREN_OPEN) paren_level++;
				
					/* if we find the matching closing parenthesis */
					if ((child_end.id == Xtalk.ID_PAREN_CLOSE) && (paren_level == 0))
					{
						child_end = null;
						child_start.id = Xtalk.ID_EXPRESSION;
						if (!this._parentheses(child_start)) return false;
						found_it = true;
						break;
					}
					else
					{
						/* append this node to the subexpression we're building */
						child_start.children.push(child_end);
					}
				
					/* track closing parenthesis */
					if (child_end.id == Xtalk.ID_PAREN_CLOSE)
					{
						paren_level--;
						//assert(paren_level >= 0);
						/* should never get lower, since we pick up closing parenthesis above */
					}
				}
				if (!found_it)
				{
					Xtalk._error_syntax("Expected \")\".");
					return false;
				}
			}
			else if (child_start.id == Xtalk.ID_PAREN_CLOSE)
			{
				/* found a closing parenthesis before an opening! */
				Xtalk._error_syntax("Can't understand \")\".");
				return false;
			}
		}
	
		return true;
	},


/*
 	Runs a variety of transformation routines to parse the majority of expression constructs,
	including synonyms, properties, constants, object references, function calls, and operators.

    ! The sequence of calls in this function is deliberate and changes may impact the functioning
      of the parser.
 */
	_subexpression: function(in_subexpr)
	{
		/* parse subexpressions contained within this one */
		for (var i = 0; i < in_subexpr.children.length; i++)
		{
			var child = in_subexpr.children[i];
			if (!child) continue;
			if (child.id == Xtalk.ID_EXPRESSION)
				if (!this._subexpression(child)) return false;
		}
	
		/* identify names and their arguments (if any);
		constants, properties, chunk expressions, object references, number of */
		this._tag_identify_names(in_subexpr);
	
		/* coalesce names with their contexts (of / in) */
		this._coalesce_contexts(in_subexpr);

		/* translate operators and their operands */
		this._operators(in_subexpr);

		return true;
	},


/*
	Final validation opportunity on expression tree.
	Throws an exception if validation fails.

	! *** WILL NEED REVISION SUBJECT TO COPIOUS DOCUMENTATION OF ALL VARIOUS SUBTREE TYPES AND EXTENSIVE TESTING ***
*/

	_validate: function(in_tree)
	{   
		if (!in_tree) return false;
		switch (in_tree.id)
		{
			case Xtalk.ID_EXPRESSION:
				// valid sub-expressions are not allowed to have more than one term //
				if (in_tree.children.length > 1)
				{
					Xtalk._error_syntax("Expected operator but found something else.");
					return false;
				}
				if (in_tree.children.length == 1)
				{
					if (!in_tree.children[0])
					{
						Xtalk._error_syntax("Can't understand \"( )\".");
						return false;
					}
					this._validate(in_tree.children[0]);
				}
				return true;
		
			case Xtalk.ID_WORD:
			case Xtalk.ID_LITERAL_BOOLEAN:
			case Xtalk.ID_LITERAL_INTEGER:
			case Xtalk.ID_LITERAL_REAL:
			case Xtalk.ID_LITERAL_STRING:
				// literals and keywords on their own are always valid, 
				 //assuming the rest of the expression checks out okay //
				return true;
			
			case Xtalk.ID_NUMBER_OF:
			case Xtalk.ID_REFERENCE:
				return true; // REVISED, NEEDS CHECKING
				/*if (in_tree->value.ref.is_collection)
				{
					// collection references, eg "the cards", "the buttons", "the items",
					 //are valid as long as all their children (parameters) are valid;
					 //however their parameters may be NULL //
					for (int i = 0; i < in_tree->children_count; i++)
					{
						if (in_tree->children[i] != NULL)
						{
							if (!in_tree->children[0])
							{
								ERROR_SYNTAX("Can't understand arguments of \"%s\".", in_tree->value.ref.id, NULL);
								return XTE_FALSE;
							}
							if (!_xte_validate_subexpression(in_engine, in_tree->children[i], in_source_line)) return XTE_FALSE;
						}
					}
					return XTE_TRUE;
				}*/
			case Xtalk.ID_FUNCTION_CALL:
			case Xtalk.ID_CONSTANT:
			case Xtalk.ID_PROPERTY:

				// NEEDS REVISION **********
		
				// non-collection references, functions, properties, constants and operators;
				 //must all have valid, non-NULL parameters/operands //
				/*for (var i = 0; i < in_tree.children.length; i++)
				{
					var subexpr = in_tree.children[i];
					if (!subexpr)
					{
						switch (in_tree.id)
						{
							case Xtalk.ID_REFERENCE:
							   // if (strcmp(in_tree->value.ref.id, "string") == 0)
								//	ERROR_SYNTAX("Can't understand arguments of chunk expression.", NULL, NULL);
								//else
								//	ERROR_SYNTAX("Can't understand arguments of \"%s\".", in_tree->value.ref.id, NULL);
								break;
							case Xtalk.ID_FUNCTION_CALL:
							case Xtalk.ID_CONSTANT:
							case Xtalk.ID_PROPERTY:
								Xtalk._error_syntax("Can't understand arguments of \"%s\".", in_tree.name);
								break;
							case Xtalk.ID_OPERATOR:
								Xtalk._error_syntax("Can't understand arguments of \"%s\".", in_tree.text);
								break;
							default:
								throw "expr.js: _validate(): unimplemented case in TYPE_OPERATOR handler.";
								break;
						}
						return false;
					}
				
					if (!this._validate(subexpr)) return false;
				}*/
				return true;
			
			case Xtalk.ID_LIST:
				// lists and other types are not allowed in valid expressions //
			default:
				if (in_tree.operand1)
				{
					this._validate(in_tree.operand1);
					if (in_tree.operand2)
						this._validate(in_tree.operand2);
				}
				else
					Xtalk._error_syntax("Can't understand this.");
				return;
		}
	
		// should never get here, all cases should be handled by switch //
		Xtalk._error_syntax('Internal Error: Unhandled node type in expression validator.');
	},
	

	
/*****************************************************************************************
Entry
*/
	
/*
 	Initiates the parsing of an expression.  The token stream provided should be as 
 	obtained from the lexer.
 */
	parse: function(in_subtree)
	{
		in_subtree.id = Xtalk.ID_EXPRESSION;

		/* fix negation operator when occurring at the beginning of an expression;
		in these cases, the lexer doesn't have adequate information to correctly determine
		the operator identity. */
		if (in_subtree.children[0] &&
			in_subtree.children[0].id == Xtalk.ID_OPERATOR &&
			in_subtree.children[0].id == Xtalk.ID_SUBTRACT)
			in_subtree.children[0].id = Xtalk.ID_NEGATE;
			
		// actually need to fix all negation operators - since they're no longer identified by this lexer ****
	
		this._parentheses(in_subtree);
		this._subexpression(in_subtree);
		//this._validate(in_subtree);
		
		return in_subtree;
	}
	
};



