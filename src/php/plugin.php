<?php
/*
CinsImp
Plugin

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

class Plugin
{

	public static function load($in_type_name)
	{
		/* determine and sanitise the type and name */
		$parts = explode('/', str_replace('.', '', substr($in_type_name, 0, 1024)));
		if (count($parts) != 2)
			CinsImpError::malformed('Plugin type-name must be of form: <type>/<name>');
		$type = $parts[0].'s';
		$name = $parts[1];
		unset($parts);
		
		/* load the main plugin definition file */
		global $config;
		$plugin_base = $config->base.'plugins/'.$type.'/'.$name.'/';
		$plugin_file_path = $plugin_base.$name.'.js';
		if (!file_exists($plugin_file_path))
			CinsImpError::missing('Plugin', $plugin_file_path);
		$plugin_file = file_get_contents($plugin_file_path);
		
		/* output the file to the requestor */
		Util::response_is_ajax_only();
		print $plugin_file;
	}
	
	
	public static function get_commands_list()
	{
		global $config;
		$plugin_dir = $config->base.'plugins/commands/';
		$list = array();
		if ($handle = opendir($plugin_dir)) 
		{
			while (false !== ($entry = readdir($handle))) 
			{
				if ($entry != "." && $entry != ".." && 
						is_dir($plugin_dir . $entry))
				{
					$list[] = $entry;
				}
			}
			closedir($handle);
		}
		return $list;
	}
}


