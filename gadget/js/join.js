/*  _____________________________________________________________________________
 * |                                                                             |
 * |                    === WARNING: GADGET FILE ===                      |
 * |                  Changes to this page affect many users.                    |
 * | Please discuss changes on the talk page or on [[MediaWiki_talk:Gadgets-definition]] before editing. |
 * |_____________________________________________________________________________|
 *
 * "join" feature, to be used by the Wikimedia Foundation's Grants Programme, 
 */
//<nowiki>
importStylesheet('User:Jeph_paul/join.css');
 
var joinGadget = function(){
	/* Variables */
	var dialog = null;
	//The path to the config file
	this.joinInterfaceMessages = 'User:Jeph_paul/joinInterfaceMessages';
	this.joinConfig = 'User:Jeph_paul/joinconfig';
	//The time taken for the page to scroll to the feedback (milliseconds)
	var feedbackScrollTime = 2000;
	//The time taken for the feedback to disappear (milliseconds)
	var feedbackDisappearDelay = 10000;
	var infobox = '';
	var roleDict = {};
	var api = new mw.Api();	
	var that = this;
	/* Functions */
	//To set cookie after feedback/joinment has been added
	var setFeedbackCookie = function(){
		$.cookie('joinFeedback',true);
	};
 
	//To add the page to the user's watch list
	var watchPage = function (){
		return api.watch(mw.config.get('wgCanonicalNamespace')+':'+mw.config.get('wgTitle'));
	};
 
	//To display error message in case of an error
	var errorMessage =  function(){
		$('.joinError').show();
	};
 
	//To detect the type of grant/page type. IEG,PEG etc
	var grantType = function(joinConfig){
		var grant = mw.config.get('wgTitle').split('/')[0];
		if (grant in joinConfig){
			return joinConfig[grant];
		}
		else{
			return joinConfig['default'];
		}
	};
	//To add the joinment thank you message
	//remove hardcoding of the joinment/join id in the rendered html
	this.joinFeedback = function(){
		var li = $('#'+$.trim(grantType(joinConfig)['section'])).parent().next().find('li').eq(-1);
		speechBubble = li.append($('<div class="joinSpeechBubbleContainer"></div>').html('<div class="joinSpeechBubble">\
		<span localize="message-feedback">Thank You</span></div><div class="joinArrowDown"></div>')).find('.joinSpeechBubbleContainer');
		var width = li.css('display','inline-block').width();
		li.css('display','');
		li.css('position','relative');
		speechBubble.css('left',width/2+'px');
		$('[localize=message-feedback]').html(grantType(joinInterfaceMessages)['message-feedback']);
		$("body, html").animate({ scrollTop : li[0].offsetTop}, feedbackScrollTime);
		setTimeout(function(){ speechBubble.hide();},feedbackDisappearDelay);
	};
	//To check if feedback has been added & has been set so in the cookie
	this.checkFeedbackCookie = function(){
		if($.cookie('joinFeedback')){
			$.cookie('joinFeedback',null);
			return true;
		}
		else{
			return false;
		}
	};
	//To detect the language fo the page
	this.userLanguage = function(){
		return mw.config.get('wgUserLanguage');
	};
	this.contentLanguage = function(){
		return mw.config.get('wgContentLanguage');
	};
	//To localize the gadget interface messages based on the language detected above
	var localizeGadget = function (gadgetClass,localizeDict){
		$(gadgetClass+' [localize]').each(function(){
			var localizeValue = $.trim(localizeDict[$(this).attr('localize')]);
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
	//To remove extra spaces from the joinment string
	var cleanupText = function(text){
			text = $.trim(text)+' ';
			var indexOf = text.indexOf('~~~~');
			if ( indexOf == -1 ){
				return text;
			}
			else{
				return text.slice(0,indexOf)+text.slice(indexOf+4);
			}	
	};
	//To create the dialog box. It is created once on the time of page load 
	var createDialog = function(){
		dialog = $( "<div id='joinDialog'></div>" )
				.html(
					'<select class="roleSelect" localize="placeholder-role" data-placeholder="Select a role">\
						<option></option>\
					</select>\
					<div localize="message-description" class="joinDescription">Tell us how you would like to help</div>\
					 <div class="error joinHide joinError" localize="message-error">An error occured</div>\
					 <textarea rows="5" cols="10" placeholder="Add your comment" id="joinComment" class="" localize="placeholder-comment"></textarea>\
					 <span localize="message-signature" class="gadgetSignature">Your signature will be added automatically</span>\
					 <div class="gadgetControls">\
						<a href="#" localize="button-cancel" class="mw-ui-button cancel mw-ui-quiet">Cancel</a>\
						<input type="submit" localize="button-join" class="mw-ui-button mw-ui-constructive add-join" disabled localize="button" value="Join"></input>\
					 </div>'
		).dialog({
				dialogClass: 'joinGadget',
				autoOpen: false,
				title: 'join Comment',
				width: '495px',
				modal: true,
				closeOnEscape: true,
				resizable: false,
				draggable: false,
				close: function( event, ui ) {
					$('#joinComment').val('');
				}
			});
			$('.add-join').click(function(){
				//var joinRole = grantType(joinConfig)['message']+' '+$('.roleSelect').val().replace(/_/,' ')+'.';
				//var joinRole = grantType(joinConfig)['message'] + '.';
				var joinRole = $('.roleSelect').val().replace(/_/,' ');
				joinRole=joinRole[0].toUpperCase()+joinRole.slice(1);
				joinRole = "'''"+ joinRole + "'''" + " ";
				that.addjoinment(joinRole+cleanupText($('#joinComment').val()));
			});
			$('#joinComment').on('change keyup paste',function(){
				$('.joinError').hide();
					if($(this).val()){
						$('.gadgetSignature').css('visibility','visible');
						if($('.roleSelect').val()){
							$('.add-join').attr('disabled',false);
						}
					}
					else{
						$('.add-join').attr('disabled',true);
						$('.gadgetSignature').css('visibility','hidden');
					}
			});
			$('#ui-dialog-title-joinDialog').attr('localize','title');
 
			$('.joinGadget .cancel').click(function(){
				dialog.dialog('close');
			});
			localizeGadget('.joinGadget',grantType(joinInterfaceMessages));
			$('.gadgetSignature').css('visibility','hidden');
 
			//values in dropdown
 
			api.get({
						'format':'json',
						'action':'parse',
						'prop':'wikitext',
						'page': mw.config.get('wgPageName'),
						'section': 0
					}).then(function(result){
							var roles = grantType(joinInterfaceMessages)['roles'];
							//var roles = roleString.split(',');
							var wikitext = result.parse.wikitext['*'];
							var infobox = wikitext.slice(wikitext.indexOf('{{Probox'),wikitext.indexOf('}}')+2);
							that.infobox = infobox;
							units = infobox.split('|');
							//var roleDict = {};
							for (unit in units){
								var roleParsedWikitext = units[unit].split('=')[0];
								var individualParsedWikitext = units[unit].split('=')[1];
								var role = units[unit].match(/[a-zA-z]+/)[0];
								var count = units[unit].split('=')[0].match(/[0-9]+/)?units[unit].split('=')[0].match(/[0-9]+/)[0]:1;
								if(role in roles){
									roleDict[role]=count;
									if ($.trim(individualParsedWikitext) == ''){
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
							$('.roleSelect').on('change',function(){
								if($(this).val() && $('#joinComment').val()){
									$('.add-join').attr('disabled',false);
								}
								else{
									$('.add-join').attr('disabled',true);
								}
							});
						});		 
	};
	this.joinDialog = function () {
		if (dialog === null){
			createDialog();
		}
		else{
			dialog.dialog('open');
		}
	};
	var addToInfobox = function(username){
		return '[[User:' + username + '|' + username + ']]';
	};
	/*
	 * The main function to add the feedback/joinment to the page. It first checks if the page has an joinment section.
	 * If it dosent it creates a new section called joinments and appends the fedback/joinment to that section, 
	 * else it appends the feedback/joinment to existing joinments section. 
	 */
	this.addjoinment = function( text ) {
		var joinComment = '\n*' + text + '~~~~' + '\n';
		//Editing the infobox
		var roleSelected = $('.roleSelect').val();
		var units = that.infobox.split('\n');
		var emptyRoleAdded = false;
		for (unit in units){
			if ($.trim(units[unit].split('=')[1]) == ''){			
				var role = units[unit].match(/[a-zA-z]+/);
				if (role){
					role = role[0];
				}
				if(role == roleSelected){
					units[unit] = $.trim(units[unit]) + addToInfobox(mw.config.get('wgUserName'));
					emptyRoleAdded = true;
					break;
				}
			}
		}
		var modifiedInfoBox = units.join("\n");
		if(!emptyRoleAdded){
			var paramCount = parseInt(roleDict["volunteer"])+1;
			modifiedInfoBox = modifiedInfoBox.split('}}')[0]+'|volunteer'+paramCount+'='+addToInfobox(mw.config.get('wgUserName'))+'\n}}';
		}
		//end editing the infobox
		api.post({
			'action' : 'edit',
			'title' : mw.config.get('wgPageName'),
			'text' : modifiedInfoBox,
			'summary' : mw.user.getName() + ' joined the project as a ' + roleSelected,
			'section': 0,
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
						if ($.trim(sections[section]['anchor']) == $.trim(grantType(joinConfig)['section']) ){
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
										'summary' : 'Joining message from ' + mw.user.getName(),
										'section': sectionCount,
										'token' : mw.user.tokens.values.editToken
									}).then(function(){
											$.when(watchPage()).then(function(){
											window.location.reload(true);
											setFeedbackCookie();	
										});
									},errorMessage);
							});
					}
					else{
						var sectionHeader = grantType(joinConfig)['section'];
						api.post({
							action: 'edit',
							title: mw.config.get('wgPageName'),
							section: 'new',
							summary: sectionHeader,
							text: joinComment,
							token: mw.user.tokens.get('editToken')
						}).then(function () {
								location.reload();
								feedbackCookie();
							}, errorMessage);
					}			
			},errorMessage);
		},errorMessage); 
 
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
			if (  namespace == "Grants" ) {
				if(mw.config.get('wgPageContentLanguage') == 'en'){
					var join = new joinGadget();		
					var api = new mw.Api();
					var joinInterfaceMessagesTitle = join.joinInterfaceMessages+'/'+join.userLanguage();
					var joinConfigTitle = join.joinConfig+'/'+join.contentLanguage();
					//To detect if we have the gadget translations in the language of the page.
					api.get({'action':'query','titles':joinInterfaceMessagesTitle+'|'+joinConfigTitle,'format':'json'}).then(function(data){	
 
						for(id in data.query.pages){
							if (data.query.pages[id].title == join.joinInterfaceMessages && id == -1){
								joinInterfaceMessagesTitle = join.joinInterfaceMessages+'/en';
							}
							if (data.query.pages[id].title == join.joinConfig && id == -1){
								joinConfigTitle = join.joinConfig+'/en';
							}
						}
 
						var joinInterfaceMessagesUrl = 'https://meta.wikimedia.org/w/index.php?title='+joinInterfaceMessagesTitle+'&action=raw&ctype=text/javascript&smaxage=21600&maxage=86400';
						var joinConfigUrl = 'https://meta.wikimedia.org/w/index.php?title='+joinConfigTitle+'&action=raw&ctype=text/javascript&smaxage=21600&maxage=86400';
						//Get the config for the detected language
						$.when(jQuery.getScript(joinInterfaceMessagesUrl),jQuery.getScript(joinConfigUrl)).then(function(){
 
							join.joinDialog();
							$('.wp-join-button').click(function(e){
													e.preventDefault();
													join.joinDialog();
												});
								if(join.checkFeedbackCookie()){
									join.joinFeedback();
								}	
						});
					});
				}
				else{
					$('.wp-join-button').hide();
				}
			}
		})();
	}); 
});
 
//</nowiki>
