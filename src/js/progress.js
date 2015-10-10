/*
CinsImp
Progress Message Management

*********************************************************************************
Copyright (c) 2009-2015, Joshua Hawcroft
All rights reserved.

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
DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


function Progress() {}

Progress._in_progress = false;
Progress._auto_show_timer = null;



Progress.operation_begun = function()
{
	Progress._in_progress = true;
	if (Progress._auto_show_timer)
		window.clearTimeout(Progress._auto_show_timer);
	Progress._auto_show_timer = window.setTimeout(Progress._show, 750);	
}


Progress._show = function()
{
	if (!Progress._in_progress) return;
	Dialog.Progress.show();
}


Progress._hide = function()
{
	Dialog.Progress.hide();
}


Progress.operation_finished = function()
{
	if (Progress._auto_show_timer)
		window.clearTimeout(Progress._auto_show_timer);
	Progress._in_progress = false;
	Progress._hide();
}



