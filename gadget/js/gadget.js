/*  ______________________________________________________________________________________
 * |                                                                                     |
 * |                    === WARNING: GADGET FILE ===                                     |
 * |                  Changes to this page affect many users.                            |
 * | Please discuss changes on the talk page or on [[MediaWiki_talk:Gadgets-definition]] |
 * |	 before editing.                                                                 |
 * |_____________________________________________________________________________________|
 *
 * "Endorse & Join" feature, to be used by the Wikimedia Foundation's Grants Programme
 */
//<nowiki>

//The stylesheet with all the styles for the endorse & the join gadget
importStylesheet('MediaWiki:Gadget-addMe.css');
/*
 * Common utilities for both the endorse & the join gadget
 */
var gadgetUtilities = function (){
	//A reference to the object
	var that = this;
	//The mw wrapper to access the API
	var api = new mw.Api();
	
	/*
	 * The interface messages or strings are maintained in interfaceMessagesPath & config values eg, 
	 * section-header, the section where the comments are added etc are maintained in configPath
	 */
	this.interfaceMessagesPath = 'Meta:AddMe/InterfaceText';
	this.configPath = 'Meta:AddMe/Config';
	
	//The time taken for the page to scroll to the feedback speech bubble (milliseconds)
	this.feedbackScrollTime = 2000;
	
	//The time taken for the feedback speech bubble to disappear (milliseconds)
	this.feedbackDisappearDelay = 10000;
	/*
	 * This function is used to set a cookie to show the speech bubble
	 * on page reload
	 */
	this.setFeedbackCookie = function(value){
		$.cookie(value,true);
	};
	/*
	 * This function is used to check if a has been set by the above function 
	 * to show the speech bubble on page reload
	 */
	this.checkFeedbackCookie = function(value){
		if($.cookie(value)){
			$.cookie(value,null);
			return true;
		}
		else{
			return false;
		}
	};
	/*
	 * To display an error message when an error occurs
	 * in the gadget 
	 */
	this.showErrorMessage =  function(gadget,type){
		var errorAttr = '[localize=error-'+type+']';
		var gadgetID = '.'+gadget;
		$(gadgetID + ' ' + errorAttr).show();
	};
	/*
	 * To remove the error message displayed by the above function 
	 */
	this.removeErrorMessage = function(gadget){
		var gadgetID = '.'+gadget;
		$(gadgetID + ' [localize^="error-"]').hide();
	};
	/*
	 * To detect the type of grant. IEG,PEG etc
	 */
	this.grantType = function(config){
		var grant = mw.config.get('wgTitle').split('/')[0].replace(/ /g,'_');
		if (grant in config){
			return config[grant];
		}
		else{
			return config['default'];
		}
	};
	/*
	 * To detect the users default language
	 */
	this.userLanguage = function(){
		return mw.config.get('wgUserLanguage');
	};
	/*
	 * To detect the language of the page
	 */
	this.contentLanguage = function(){
		return mw.config.get('wgContentLanguage');
	};
	/*
	 * To remove extra spaces & cleanup the comment string
	 */
	this.cleanupText = function(text){
			text = $.trim(text)+' ';
			var indexOf = text.indexOf('~~~~');
			if ( indexOf == -1 ){
				return text;
			}
			else{
				return text.slice(0,indexOf)+text.slice(indexOf+4);
			}	
	};
	/*
	 * The config files which can be translated with the help of the 
	 * translation tool generates the dict with the values having a 
	 * lot of space in the key value pairs. This function strips the 
	 * whitespace.
	 */
	this.stripWhiteSpace = function(dict){
		for (key in dict){
			//Temp fix for section header
			if(key == 'section-header'){
				dict['section-header-read'] = dict[key].replace(/ /g,'_');
				dict['section-header-write'] = dict[key];
			}
			dict[key] = typeof(dict[key]) == 'object' ? that.stripWhiteSpace(dict[key]) : $.trim(dict[key]);
		}
		return dict;
	};
	/*
	 * The function creates the markup for the link to a 
	 * user's user page
	 */
	this.addToInfobox = function(username){
		return username;
	};
	/*
	 * To localize the gadget's interface messages based on the user's language setting
	 */
	this.localizeGadget = function (gadgetClass,localizeDict){
		$(gadgetClass+' [localize]').each(function(){
			var localizeValue = localizeDict[$(this).attr('localize')];
			if($(this).attr('value')){
				$(this).attr('value',localizeValue);
			}
			else if($(this).attr('placeholder')){
				$(this).attr('placeholder',localizeValue);
			}
			else if($(this).attr('data-placeholder')){
				$(this).attr('data-placeholder',localizeValue);
			}
			else{
				$(this).html(localizeValue);
			}
		});
	};
	/*
	 * This function show the feedback speech bubble after an 
	 * endorsement has been made or after joining a project
	 */
	this.showFeedback = function(config,InterfaceMessages){
		var li = $('#'+config['section-header-read']).parent().next().find('li').eq(-1);
		speechBubble = li.append($('<div class="grantsSpeechBubbleContainer"></div>').html('<div class="grantsSpeechBubble">\
		<span localize="message-feedback">Thank You</span></div><div class="grantsSpeechBubbleArrowDown"></div>')).find('.grantsSpeechBubbleContainer');
		var width = li.css('display','inline-block').width();
		li.css('display','');
		li.css('position','relative');
		speechBubble.css('left',width/2+'px');
		$('[localize=message-feedback]').html(InterfaceMessages['message-feedback']);
		$("body, html").animate({ scrollTop : li[0].offsetTop}, that.feedbackScrollTime);
		setTimeout(function(){ speechBubble.hide();},that.feedbackDisappearDelay);
	};
};
/*
 * The Endorse Gadget
 */
var endorseGadget = function(){
	/* Variables */
	var util = new gadgetUtilities();
	var dialog = null;
	
	var api = new mw.Api();	
	var that = this;

	/*
	 * This function creates the dialog box for the gadget.
	 * It is also where all the dialog related interactions are defined.
	 */ 
	var createDialog = function(){
		dialog = $( "<div id='devEndorseDialog'></div>" )
				.html(
					'<div class="mw-ui-vform">\
					 	<div class="error grantsHide" localize="error-save">An error occured</div>\
					 	<div class="error grantsHide" localize="error-login">An error occured</div>\
					 </div>\
					 <div localize="message-description" class="messageDescription">Explaining your endorsement improves process</div>' + '\
					 <textarea rows="5" cols="10" placeholder="Add your comment" id="devEndorseComment" class="" localize="placeholder-comment"></textarea>\
					 <span localize="message-signature" class="messageSignature">Your signature will be added automatically</span>\
					 <div class="gadgetControls">\
						<a href="#" localize="button-cancel" class="mw-ui-button cancel mw-ui-quiet">Cancel</a>\
						<input type="submit" localize="button-submit" class="mw-ui-button mw-ui-constructive add-endorse" disabled localize="button" value="Ok"></input>\
					 </div>'
		).dialog({
				dialogClass: 'grantsGadget endorseGadget',
				autoOpen: false,
				title: 'Endorse Comment',
				width: '495px',
				modal: true,
				closeOnEscape: true,
				resizable: false,
				draggable: false,
				close: function( event, ui ) {
					$('#devEndorseComment').val('');
				}
			});

			$('.add-endorse').click(function(){
				that.addEndorsement(util.cleanupText($('#devEndorseComment').val()));
			});
			
			$('#devEndorseComment').on('change keyup paste',function(){
					util.removeErrorMessage('endorseGadget');
					if($(this).val()){
						$('.add-endorse').attr('disabled',false);
						$('.messageSignature').css('visibility','visible');
					}
					else{
						$('.add-endorse').attr('disabled',true);
						$('.messageSignature').css('visibility','hidden');
					}
			});
			$('.endorseGadget .ui-dialog-title').attr('localize','title');
			
			$('.endorseGadget .cancel').click(function(){
				dialog.dialog('close');
			});
			
			util.localizeGadget('.endorseGadget',that.interfaceMessages);
			
			$('.messageSignature').css('visibility','hidden');
	};
	this.Dialog = function () {
		if (dialog === null){
			createDialog();
		}
		else{
			dialog.dialog('open');
		}
	};
	/*
	 * The main function to add the feedback/endorsement to the page. It first checks if the page has an endorsement section.
	 * If it dosent it creates a new section called Endorsements and appends the feedback/endorsement comment to that section, 
	 * else it appends the feedback/endorsement comment to existing Endorsements section.
	 * The name of the endorsement section is defined in the config. 
	 */
	this.addEndorsement = function( text ) {
		var endorseComment = '\n*' + text + '~~~~' + '\n';
		api.get({
					'format':'json',
					'action':'parse',
					'prop':'sections',
					'page':mw.config.get('wgPageName'),
				}).then(function(result){
					var sections = result.parse.sections;
					var sectionCount = 1;
					var sectionFound = false;
					for (var section in sections ){
						if ($.trim(sections[section]['anchor']) == that.config['section-header-read'] ){
							sectionFound = true;
							break;
						}
						sectionCount++;
					}
					if (sectionFound){
						api.get({
						'format':'json',
						'action':'parse',
						'prop':'wikitext',
						'page': mw.config.get('wgPageName'),
						'section': sectionCount,
						}).then(function(result){
							var wikitext = result.parse.wikitext['*'];
							var endorsementSection = wikitext + endorseComment;
							api.post({
										'action' : 'edit',
										'title' : mw.config.get('wgPageName'),
										'text' : endorsementSection,
										'summary' : 'Endorsement from ' + mw.user.getName(),
										'section': sectionCount,
										'watchlist':'watch',
										'token' : mw.user.tokens.values.editToken
									}).then(function(){
											console.log('Successfully added endorsement');
											window.location.reload(true);
											util.setFeedbackCookie('endorseFeedback');	
									},function(){
										util.showErrorMessage('endorseGadget','save');
										});
							});
					}
					else{
						var sectionHeader = that.config['section-header-write'];
						api.post({
							'action': 'edit',
							'title': mw.config.get('wgPageName'),
							'section': 'new',
							'summary': sectionHeader + 'Adding my name to the participants section',
							'sectiontitle': sectionHeader,
							'text': $.trim(endorseComment),
							'watchlist':'watch',
							token: mw.user.tokens.get('editToken')
						}).then(function () {
								console.log('Successfully added endorsement');
								location.reload();
								util.setFeedbackCookie('endorseFeedback');
							}, function(){
								util.showErrorMessage('endorseGadget','save');
								});
					}			
			}, function(){
				util.showErrorMessage('endorseGadget','save');
				});
	};
};
/*
 * The function the create the join gadget and provides 
 * all the needed functionality.
 */
var joinGadget = function(){
	/* Variables */
	var util = new gadgetUtilities();
	var dialog = null;
	
	this.config = null ;
	this.interfaceMessages = null;
	
	var infobox = '';
	var roleDict = {};
	var api = new mw.Api();	
	var that = this;
	/*
	 * A count is maintained of the open '{{' braces
	 * when a '}}' is encountered the counter is decremented.
	 * If the counter reaches 0 the end of the infobox has been found.
	 * Else the syntax is broken or the end of the infobox is not in 
	 * the first section of the page.
	 */
	var extractInfobox = function(markup){
		var startIndex = markup.indexOf('{{Probox');
		var counter = 0;
		var endIndex = 0;
		for (i=startIndex;i<markup.length;i++){ 
			if(markup[i] == '}' && markup[i+1] == '}'){ 
					counter++;
			} 
			if(markup[i] == '{' && markup[i+1] == '{'){
				counter--;
			} 
			if(counter == 0){
				var endIndex = i+2; 
				break;
			}
		}
		if (counter != 0){
			return '';
		}
		var infobox = { 
			'infobox' : markup.slice(startIndex,endIndex),
		    'before' : markup.slice(0,startIndex),
			'after' : markup.slice(endIndex),
		};
		//return markup.slice(startIndex,endIndex);
		return infobox;
	};
	/*
	 * This function creates the dialog & defines
	 *  needed interactions in the dialog.
	 */ 
	var createDialog = function(){
		dialog = $( "<div id='devJoinDialog'></div>" )
				.html(
					'<div class="mw-ui-vform">\
					 	<div class="error grantsHide" localize="error-save">An error occured</div>\
					 	<div class="error grantsHide" localize="error-login">An error occured</div>\
					 </div>\
					<select class="roleSelect" localize="placeholder-role" data-placeholder="Select a role">\
						<option></option>\
					</select>\
					<div localize="message-description" class="messageDescription">Tell us how you would like to help</div>\
					<textarea rows="5" cols="10" placeholder="Add your comment" id="devJoinComment" class="" localize="placeholder-comment"></textarea>\
					<span localize="message-signature" class="messageSignature">Your signature will be added automatically</span>\
					<div class="gadgetControls">\
						<a href="#" localize="button-cancel" class="mw-ui-button cancel mw-ui-quiet">Cancel</a>\
						<input type="submit" localize="button-join" class="mw-ui-button mw-ui-constructive add-join" disabled localize="button" value="Join"></input>\
					 </div>'
		).dialog({
				dialogClass: 'grantsGadget joinGadget',
				autoOpen: false,
				title: 'join Comment',
				width: '495px',
				modal: true,
				closeOnEscape: true,
				resizable: false,
				draggable: false,
				close: function( event, ui ) {
					$('#devJoinComment').val('');
				}
			});
			$('.add-join').click(function(){
				/*
				 * Creating the comment to add to the participants section. The comment is of the form
				 * "Role" User comment. Eg, Volunteer I can help out in many ways.
				 */
				 
				var joinRole = $('.roleSelect').val().replace(/_/,' ');
				joinRole=joinRole[0].toUpperCase()+joinRole.slice(1);
				joinRole = "'''"+ joinRole + "'''" + " ";
				that.addjoinment(joinRole+util.cleanupText($('#devJoinComment').val()));
			});
			
			$('#devJoinComment').on('change keyup paste',function(){
				util.removeErrorMessage('joinGadget');
					if($(this).val()){
						$('.messageSignature').css('visibility','visible');
						if($('.roleSelect').val()){
							$('.add-join').attr('disabled',false);
						}
					}
					else{
						$('.add-join').attr('disabled',true);
						$('.messageSignature').css('visibility','hidden');
					}
			});
			$('.joinGadget .ui-dialog-title').attr('localize','title');
 
			$('.joinGadget .cancel').click(function(){
				dialog.dialog('close');
			});
			util.localizeGadget('.joinGadget',that.interfaceMessages);
			$('.messageSignature').css('visibility','hidden');
 
			/*
			 * The code below gets the infobox, check for open roles, 
			 * makes sure that these roles are available for other to 
			 * join by looking up roles in the config and creates a drop down 
			 * from which a user can select a role.
			 */
 
			api.get({
						'format':'json',
						'action':'parse',
						'prop':'wikitext',
						'page': mw.config.get('wgPageName'),
						'section': 0
					}).then(function(result){
							var roles = that.interfaceMessages['roles'];
							var wikitext = result.parse.wikitext['*'];
							
							var content = extractInfobox(wikitext);
							var infobox = that.infobox = content['infobox'];
							that.before = content['before'];
							that.after = content['after'];
							units = infobox.split('\n');
							for (unit in units){
								var line = units[unit];
								var role = line.match(/[a-zA-z]+/g);
								if (role){
									role = role.join('');
									var elements = line.split('=');
									var count = elements[0].match(/[0-9]+/)?elements[0].match(/[0-9]+/)[0]:1;
									if (role.indexOf('volunteer') != -1){
										roleDict['volunteer']=count;
									}
									if(role in roles && line.indexOf('=') != -1){
										roleDict[role]=count;
										if(!$('.roleSelect option[value="'+role+'"]').length){											
											$('.roleSelect').append('<option value='+role+'>'+roles[role]+'</option>');
										}
									}
								}
							}
							if(!$('.roleSelect option[value="volunteer"]').length){
								$('.roleSelect').append('<option value="volunteer">'+roles['volunteer']+'</option>');
							}
							$('.roleSelect').chosen({
								disable_search: true,
								placeholder_text_single: 'Select a role',
								width: '50%',
							});
							/* Fix this */
							/*
							$('.roleSelect').on('chosen:showing_dropdown',function(){
								util.removeErrorMessage('endorseGadget');
							});
							*/
							$('.roleSelect').on('change',function(){
								util.removeErrorMessage('joinGadget');
								if($(this).val() && $('#devJoinComment').val()){
									$('.add-join').attr('disabled',false);
								}
								else{
									$('.add-join').attr('disabled',true);
								}
							});
						});		 
	};
	this.Dialog = function () {
		if (dialog === null){
			createDialog();
		}
		else{
			dialog.dialog('open');
		}
	};
	/*
	 * The main function to add the feedback/join comment to the page. It first checks if the page has an Participants section.
	 * If it dosent it creates a new section called Participants and appends the fedback/comment to that section, 
	 * else it appends the feedback/comment to existing Participants section. 
	 */
	this.addjoinment = function( text ) {
		var joinComment = '\n*' + text + '~~~~' + '\n';
		//var joinComment = '*' + text + '~~~~' + '\n';
		//Editing the infobox
		var roleSelected = $('.roleSelect').val();
		var units = that.infobox.split('\n');
		var emptyRoleAdded = false;
		for (unit in units){
			if ($.trim(units[unit].split('=')[1]) == ''){			
				var role = units[unit].match(/[a-zA-z]+/);
				if (role){
					role = role[0];
					if(role == roleSelected){
						units[unit] = $.trim(units[unit]) + util.addToInfobox(mw.config.get('wgUserName'));
						emptyRoleAdded = true;
						break;
					}
				}
			}
		}
		var modifiedInfoBox = units.join("\n");
		if(!emptyRoleAdded){
			var paramCount = roleDict["volunteer"] ? parseInt(roleDict["volunteer"]) + 1 : 1;
			var endIndex = modifiedInfoBox.lastIndexOf('}}');
			modifiedInfoBox = modifiedInfoBox.slice(0,endIndex)+'|volunteer'+paramCount+'='+util.addToInfobox(mw.config.get('wgUserName'))+'\n}}';
		}
		
		api.post({
			'action' : 'edit',
			'title' : mw.config.get('wgPageName'),
			'text' : that.before + modifiedInfoBox + that.after,
			'summary' : 'Adding my name to the infobox',
			'section': 0,
			'watchlist':'watch',
			'token' : mw.user.tokens.values.editToken
		}).then(function(){
			api.get({
					'format':'json',
					'action':'parse',
					'prop':'sections',
					'page':mw.config.get('wgPageName'),
				}).then(function(result){
					var sections = result.parse.sections;
					var sectionCount = 1;
					var sectionFound = false;
					for (var section in sections ){
						if ($.trim(sections[section]['anchor']) == that.config['section-header-read'] ){
							sectionFound = true;
							break;
						}
						sectionCount++;
					}
					if (sectionFound){
						api.get({
							'format':'json',
							'action':'parse',
							'prop':'wikitext',
							'page': mw.config.get('wgPageName'),
							'section': sectionCount
						}).then(function(result){
							var wikitext = result.parse.wikitext['*'];
							var joinmentSection = wikitext + joinComment;
							api.post({
										'action' : 'edit',
										'title' : mw.config.get('wgPageName'),
										'text' : joinmentSection,
										'summary' : 'Adding my name to the participants section',
										'section': sectionCount,
										'watchlist':'watch',
										'token' : mw.user.tokens.values.editToken
									}).then(function(){
										console.log('Successfully added to participants');
										location.reload();
										util.setFeedbackCookie('joinFeedback');
									}, function(){
										util.showErrorMessage('joinGadget','save');
										});
							});
					}
					else{
						var sectionHeader = that.config['section-header-write'];
						api.post({
							'action': 'edit',
							'title': mw.config.get('wgPageName'),
							'section': 'new',
							'summary': sectionHeader,
							'text': $.trim(joinComment),
							'watchlist':'watch',
							'token': mw.user.tokens.get('editToken')
						}).then(function () {
								console.log('Successfully added to participants');
								location.reload();
								util.setFeedbackCookie('joinFeedback');
							}, function(){
								util.showErrorMessage('joinGadget','save');
								});
					}			
			}, function(){
				util.showErrorMessage('joinGadget','save');
				});
		}, function(){
			util.showErrorMessage('joinGadget','save');
			}); 
 
	};
};
 
/* End of functions */
mw.loader.using( ['jquery.ui.dialog', 'mediawiki.api', 'mediawiki.ui','jquery.chosen'], function() {	
	$(function() {
		(function(){
			var namespace = mw.config.get('wgCanonicalNamespace');
			/*
			 * Fix mw.config.get('wgPageContentLanguage') == 'en') checking with a better solution, 
			 * either when pages can be tagged with arbitary language or when we set langauge markers later on. 
			 * 
			 */
			if (  $('.wp-join-button,.wp-endorse-button').length) {
				if(mw.config.get('wgPageContentLanguage') == 'en'){
					
					var endorse = new endorseGadget();		
					var join = new joinGadget();		
					var util = new gadgetUtilities();
					var api = new mw.Api();
					var interfaceMessagesFullPath = util.interfaceMessagesPath+'/'+util.userLanguage();
					var configFullPath = util.configPath+'/'+util.contentLanguage();
					
					/*
					 * To detect if we have the gadget translations and config in the desired languages.
					 * Currently page language is English always. So the config returned is in en. The InterfaceMessages is
					 * in the user's language
					 */
					api.get({'action':'query','titles':interfaceMessagesFullPath+'|'+configFullPath,'format':'json'}).then(function(data){	
 
						for(id in data.query.pages){
							if (data.query.pages[id].title == util.interfaceMessagesPath && id == -1){
								interfaceMessagesFullPath = util.interfaceMessagesPath+'/en';
							}
							if (data.query.pages[id].title == util.configPath && id == -1){
								configFullPath = util.configPath+'/en';
							}
						}
 
						var interfaceMessagesUrl = 'https://meta.wikimedia.org/w/index.php?title='+interfaceMessagesFullPath+'&action=raw&ctype=text/javascript&smaxage=21600&maxage=86400';
						var configUrl = 'https://meta.wikimedia.org/w/index.php?title='+configFullPath+'&action=raw&ctype=text/javascript&smaxage=21600&maxage=86400';
						//Get the config for the detected language
						$.when(jQuery.getScript(interfaceMessagesUrl),jQuery.getScript(configUrl)).then(function(){
 							//Stripping Whitespace
 							join.config = util.stripWhiteSpace(util.grantType(joinConfig));
 							join.interfaceMessages = util.stripWhiteSpace(util.grantType(joinInterfaceMessages));
							
							endorse.config = util.stripWhiteSpace(util.grantType(endorseConfig));
							endorse.interfaceMessages = util.stripWhiteSpace(util.grantType(endorseInterfaceMessages));
							
							join.Dialog();
							$('.wp-join-button').unbind();
							$('.wp-join-button').click(function(e){
													e.preventDefault();
													join.Dialog();
												});
							if(util.checkFeedbackCookie('joinFeedback')){
								util.showFeedback(join.config, join.interfaceMessages);
							}
							endorse.Dialog();
							$('.wp-endorse-button').unbind();
							$('.wp-endorse-button').click(function(e){
													e.preventDefault();
													endorse.Dialog();
												});	
							
							//Checking if the user is logged in
							if(!mw.config.get('wgUserName')){
								util.showErrorMessage('endorseGadget','login');
								util.showErrorMessage('joinGadget','login');	
							}
							
							if(util.checkFeedbackCookie('endorseFeedback')){
								util.showFeedback(endorse.config, endorse.interfaceMessages);
							}	
						});
					});
				}
				else{
					$('.wp-join-button').hide();
					$('.wp-endorse-button').hide();
				}
			}
		})();
	}); 
});
 
//</nowiki>
