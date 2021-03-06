/**
* Utility Methods
*/
var Favorites = Favorites || {};

Favorites.Utilities = function()
{
	var plugin = this;
	var $ = jQuery;

	/*
	* Check if an item is favorited
	* @param int post_id
	* @param object favorites for a specific site
	*/
	plugin.isFavorite = function(post_id, site_favorites)
	{
		var status = false;
		$.each(site_favorites, function(i, v){
			if ( v.post_id === parseInt(post_id) ) status = true;
			if ( parseInt(v.post_id) === post_id ) status = true;
		});
		return status;
	}

	/**
	* Get the length of an
	*/
	plugin.objectLength = function(object)
	{
		var size = 0, key;
		for (key in object) {
			if (object.hasOwnProperty(key)) size++;
		}
		return size;
	}

	/*
	* Get Site index from All Favorites
	*/
	plugin.siteIndex = function(siteid)
	{
		for ( var i = 0; i < Favorites.userFavorites.length; i++ ){
			if ( Favorites.userFavorites[i].site_id !== parseInt(siteid) ) continue;
			return i;
		}
	}

	/*
	* Get a specific thumbnail size
	*/
	plugin.getThumbnail = function(favorite, size)
	{
		var thumbnails = favorite.thumbnails;
		if ( typeof thumbnails === 'undefined' || thumbnails.length == 0 ) return false;
		var thumbnail_url = thumbnails[size];
		if ( typeof thumbnail_url === 'undefined' ) return false;
		if ( !thumbnail_url ) return false;
		return thumbnail_url;
	}
}
/**
* Formatting functionality
*/
var Favorites = Favorites || {};

Favorites.Formatter = function()
{
	var plugin = this;
	var $ = jQuery;

	/*
	*  Add Favorite Count to a button
	*/
	plugin.addFavoriteCount = function(html, count)
	{
		if ( !Favorites.jsData.button_options.include_count ) return html;
		if ( count <= 0 ) count = 0;
		html += ' <span class="simplefavorite-button-count">' + count + '</span>';
		return html;
	}

	/**
	* Decrement all counts by one
	*/
	plugin.decrementAllCounts = function(){
		var buttons = $('.simplefavorite-button.active.has-count');
		for ( var i = 0; i < buttons.length; i++ ){
			var button = $(buttons)[i];
			var count_display = $(button).find('.simplefavorite-button-count');
			var new_count = $(count_display).text() - 1;
			$(button).attr('data-favoritecount', new_count);
		}
	}
}
/**
* Builds the favorite button html
*/
var Favorites = Favorites || {};

Favorites.ButtonOptionsFormatter = function()
{
	var plugin = this;
	var $ = jQuery;

	plugin.options = Favorites.jsData.button_options;
	plugin.formatter = new Favorites.Formatter;

	plugin.format = function(button, isFavorite)
	{
		if ( plugin.options.custom_colors ) plugin.colors(button, isFavorite);
		plugin.html(button, isFavorite);
	}

	plugin.html = function(button, isFavorite)
	{
		var count = $(button).attr('data-favoritecount');
		var options = plugin.options.button_type;
		var html = '';

		if ( plugin.options.button_type === 'custom' ){
			if ( isFavorite ) $(button).html(plugin.formatter.addFavoriteCount(Favorites.jsData.favorited, count));
			if ( !isFavorite ) $(button).html(plugin.formatter.addFavoriteCount(Favorites.jsData.favorite, count));
			return;
		}
		if ( isFavorite ){
			html += '<i class="' + options.icon_class + '"></i> ';
			html += options.state_active;
			$(button).html(plugin.formatter.addFavoriteCount(html, count));
			return;
		}
		html += '<i class="' + options.icon_class + '"></i> ';
		html += options.state_default;
		$(button).html(plugin.formatter.addFavoriteCount(html, count));
		plugin.applyIconColor(button, isFavorite);
	}

	plugin.colors = function(button, isFavorite)
	{
		if ( isFavorite ){
			var options = plugin.options.active;
			if ( options.background_active ) $(button).css('background-color', options.background_active);
			if ( options.border_active ) $(button).css('border-color', options.border_active);
			if ( options.text_active ) $(button).css('color', options.text_active);
			return;
		}
		var options = plugin.options.default;
		if ( options.background_default ) $(button).css('background-color', options.background_default);
		if ( options.border_default ) $(button).css('border-color', options.border_default);
		if ( options.text_default ) $(button).css('color', options.text_default);
		plugin.boxShadow(button);
	}

	plugin.boxShadow = function(button)
	{
		if ( plugin.options.box_shadow ) return;
		$(button).css('box-shadow', 'none');
		$(button).css('-webkit-box-shadow', 'none');
		$(button).css('-moz-box-shadow', 'none');
	}

	plugin.applyIconColor = function(button, isFavorite)
	{
		if ( isFavorite && plugin.options.active.icon_active ) {
			$(button).find('i').css('color', plugin.options.active.icon_active);
		}
		if ( !isFavorite && plugin.options.default.icon_default ) {
			$(button).find('i').css('color', plugin.options.default.icon_default);
		}
	}
}
/**
* Generates a new nonce on page load via AJAX
* Solves problem of cached pages and expired nonces
*
* Events:
* favorites-nonce-generated: The nonce has been generated
*/
var Favorites = Favorites || {};

Favorites.NonceGenerator = function()
{
	var plugin = this;
	var $ = jQuery;

	plugin.bindEvents = function()
	{
		$(document).ready(function(){
			plugin.getNonce();
		});
	}

	/**
	* Make the AJAX call to get the nonce
	*/
	plugin.getNonce = function()
	{
		if ( Favorites.jsData.cache_enabled === '' ){
			Favorites.jsData.nonce = favorites_data.nonce;
			return;
		}
		$.ajax({
			url: Favorites.jsData.ajaxurl,
			type: 'post',
			datatype: 'json',
			data: {
				action : Favorites.formActions.nonce
			},
			success: function(data){
				Favorites.jsData.nonce = data.nonce;
				$(document).trigger('favorites-nonce-generated', [data.nonce]);
			}
		});
	}

	return plugin.bindEvents();
}
/**
* Gets the user favorites
*/
var Favorites = Favorites || {};

Favorites.UserFavorites = function()
{
	var plugin = this;
	var $ = jQuery;

	plugin.initialLoad = false;

	plugin.bindEvents = function()
	{
		$(document).on('favorites-nonce-generated', function(){
			plugin.initalLoad = true;
			plugin.getFavorites();
		});
	}

	/**
	* Get the user favorites
	*/
	plugin.getFavorites = function()
	{
		$.ajax({
			url: Favorites.jsData.ajaxurl,
			type: 'post',
			datatype: 'json',
			data: {
				action : Favorites.formActions.favoritesarray
			},
			success: function(data){
				Favorites.userFavorites = data.favorites;
				$(document).trigger('favorites-user-favorites-loaded', [plugin.initalLoad]);

				// Deprecated Callback
				if ( plugin.initalLoad ) favorites_after_initial_load(Favorites.userFavorites);
			}
		});
	}

	return plugin.bindEvents();
}
/**
* Clears all favorites for the user
*
* Events:
* favorites-cleared: The user's favorites have been cleared. Params: clear button
*/
var Favorites = Favorites || {};

Favorites.Clear = function()
{
	var plugin = this;
	var $ = jQuery;

	plugin.activeButton; // The active "clear favorites" button
	plugin.utilities = new Favorites.Utilities;
	plugin.formatter = new Favorites.Formatter;

	plugin.bindEvents = function()
	{
		$(document).on('click', Favorites.selectors.clear_button, function(e){
			e.preventDefault();
			plugin.activeButton = $(this);
			plugin.clearFavorites();
		});
		$(document).on('favorites-updated-single', function(){
			plugin.updateClearButtons();
		});
		$(document).on('favorites-user-favorites-loaded', function(){
			plugin.updateClearButtons();
		});
	}

	/*
	* Submit an AJAX request to clear all of the user's favorites
	*/
	plugin.clearFavorites = function()
	{
		plugin.loading(true);
		var site_id = $(plugin.activeButton).attr('data-siteid');
		$.ajax({
			url: Favorites.jsData.ajaxurl,
			type: 'post',
			datatype: 'json',
			data: {
				action : Favorites.formActions.clearall,
				nonce : Favorites.jsData.nonce,
				siteid : site_id,
			},
			success : function(data){
				plugin.formatter.decrementAllCounts();
				plugin.loading(false);
				plugin.clearSiteFavorites(site_id);
				$(document).trigger('favorites-cleared', [plugin.activeButton]);
			}
		});
	}

	/**
	* Toggle the button loading state
	*/
	plugin.loading = function(loading)
	{
		if ( loading ){
			$(plugin.activeButton).addClass(Favorites.cssClasses.loading);
			$(plugin.activeButton).attr('disabled', 'disabled');
			return;
		}
		$(plugin.activeButton).removeClass(Favorites.cssClasses.loading);
	}

	/*
	* Update disabled status for clear buttons
	*/
	plugin.updateClearButtons = function()
	{
		var button;
		var siteid; 
		for ( var i = 0; i < $(Favorites.selectors.clear_button).length; i++ ){
			button = $(Favorites.selectors.clear_button)[i];
			siteid = $(button).attr('data-siteid');
			for ( var c = 0; c < Favorites.userFavorites.length; c++ ){
				if ( Favorites.userFavorites[c].site_id !== parseInt(siteid) ) continue;
				if ( plugin.utilities.objectLength(Favorites.userFavorites[c].posts) > 0 ) {
					$(button).attr('disabled', false);
					continue;
				}
				$(button).attr('disabled', 'disabled');
			}
		}
	}

	/**
	* Clear out favorites for this site id (fix for cookie-enabled sites)
	*/
	plugin.clearSiteFavorites = function(site_id)
	{
		$.each(Favorites.userFavorites, function(i, v){
			if ( this.site_id !== parseInt(site_id) ) return;
			Favorites.userFavorites[i].posts = {};
		});
	}

	return plugin.bindEvents();
}
/**
* Favorites List functionality
*/
var Favorites = Favorites || {};

Favorites.Lists = function()
{
	var plugin = this;
	var $ = jQuery;

	plugin.utilities = new Favorites.Utilities;

	plugin.bindEvents = function()
	{
		$(document).on('favorites-updated-single', function(){
			plugin.updateAllLists();
		});
		$(document).on('favorites-cleared', function(){
			plugin.updateAllLists();
		});
	}

	/**
	* Loop through all the favorites lists
	*/
	plugin.updateAllLists = function()
	{
		for ( var i = 0; i < Favorites.userFavorites.length; i++ ){
			var lists = $(Favorites.selectors.list + '[data-siteid="' + Favorites.userFavorites[i].site_id + '"]');
			for ( var c = 0; c < $(lists).length; c++ ){
				if ( $(lists[c]).attr('data-userid') === "" ){
					var list = $(lists)[c];
					plugin.updateSingleList($(list), Favorites.userFavorites[i].posts);
				} else {
					plugin.updateUserList(lists[c]);
				}
			}
		}
	}

	// Update a single list html
	plugin.updateSingleList = function(list, favorites)
	{
		plugin.removeInvalidListItems(list, favorites);

		var include_buttons = ( $(list).attr('data-includebuttons') === 'true' ) ? true : false;
		var include_links = ( $(list).attr('data-includelinks') === 'true' ) ? true : false;
		var include_thumbnails = ( $(list).attr('data-includethumbnails') === 'true' ) ? true : false;
		var include_excerpts = ( $(list).attr('data-includeexcerpts') === 'true' ) ? true : false;
		var thumbnail_size = $(list).attr('data-thumbnailsize');

		// Remove list items without a data-postid attribute (backwards compatibility plugin v < 1.2)
		var list_items = $(list).find('li');
		$.each(list_items, function(i, v){
			var attr = $(this).attr('data-postid');
			if (typeof attr === typeof undefined || attr === false) $(this).remove();
		});

		// Update the no favorites item
		if ( plugin.utilities.objectLength(favorites) > 0 ){
			$(list).find('[data-nofavorites]').remove();
		} else {
			html = '<li data-nofavorites>' + $(list).attr('data-nofavoritestext') + '</li>';
			$(list).empty().append(html);
		}

		var post_types = $(list).attr('data-posttype');
		post_types = ( typeof post_types === 'undefined' || post_types === '' ) ? 0 : post_types.split(',');
		
		// Add favorites that arent in the list
		$.each(favorites, function(i, v){
			if ( post_types.length > 0 && $.inArray(v.post_type, post_types) === -1 ) return;
			if ( $(list).find('li[data-postid=' + v.post_id + ']').length > 0 ) return;
			html = '<li data-postid="' + v.post_id + '">';
			if ( include_thumbnails ){
				var thumb_url = plugin.utilities.getThumbnail(v, thumbnail_size);
				if ( thumb_url ) html += thumb_url;
			}
			html += '<p>';
			if ( include_links ) html += '<a href="' + v.permalink + '">';
			html += v.title;
			if ( include_links ) html += '</a>';
			html += '</p>';
			if ( include_excerpts ) {
				var excerpt = v.excerpt;
				if ( typeof excerpt !== 'undefined' ) html += '<p class="excerpt">' + excerpt + '</p>';
			}
			if ( include_buttons ) html += '<p>' + v.button + '</p>';
			html += '</li>';
			$(list).append(html);
		});
	}

	/**
	* Update a specific user list
	*/
	plugin.updateUserList = function(list)
	{
		var user_id = $(list).attr('data-userid');
		var site_id = $(list).attr('data-siteid');
		var include_links = $(list).attr('data-includelinks');
		var include_buttons = $(list).attr('data-includebuttons');
		var post_type = $(list).attr('data-posttype');
		$.ajax({
			url: plugin.ajaxurl,
			type: 'post',
			datatype: 'json',
			data: {
				action : Favorites.formActions.favoritelist,
				nonce : Favorites.jsData.nonce,
				userid : user_id,
				siteid : site_id,
				includelinks : include_links,
				includebuttons : include_buttons,
				posttype : post_type
			},
			success : function(data){
				$(list).replaceWith(data.list);
			}
		});
	}

	/**
	* Remove unfavorited items from the list
	*/
	plugin.removeInvalidListItems = function(list, favorites)
	{
		var listitems = $(list).find('li[data-postid]');
		$.each(listitems, function(i, v){
			var postid = $(this).attr('data-postid');
			if ( !plugin.utilities.isFavorite(postid, favorites) ) $(this).remove();
		});
	}

	return plugin.bindEvents();
}
/**
* Favorite Buttons
* Favorites/Unfavorites a specific post
*
* Events:
* favorites-updated-single: A user's favorite has been updated. Params: favorites, post_id, site_id, status
*/
var Favorites = Favorites || {};

Favorites.Button = function()
{
	var plugin = this;
	var $ = jQuery;

	plugin.activeButton; // The clicked button
	plugin.allButtons; // All favorite buttons for the current post
	plugin.authenticated = true;

	plugin.formatter = new Favorites.Formatter;
	plugin.data = {};

	plugin.bindEvents = function()
	{
		$(document).on('click', Favorites.selectors.button, function(e){
			e.preventDefault();
			plugin.activeButton = $(this);
			plugin.setAllButtons();
			plugin.submitFavorite();
		});
	}

	/**
	* Set all buttons
	*/
	plugin.setAllButtons = function()
	{
		var post_id = $(plugin.activeButton).attr('data-postid');
		plugin.allButtons = $('button[data-postid="' + post_id + '"]');
	}

	/**
	* Set the Post Data
	*/
	plugin.setData = function()
	{
		plugin.data.post_id = $(plugin.activeButton).attr('data-postid');
		plugin.data.site_id = $(plugin.activeButton).attr('data-siteid');
		plugin.data.status = ( $(plugin.activeButton).hasClass('active') ) ? 'inactive' : 'active';
	}

	/**
	* Submit the button
	*/
	plugin.submitFavorite = function()
	{
		plugin.loading(true);
		plugin.setData();
		$.ajax({
			url: Favorites.jsData.ajaxurl,
			type: 'post',
			datatype: 'json',
			data: {
				action : Favorites.formActions.favorite,
				nonce : Favorites.jsData.nonce,
				postid : plugin.data.post_id,
				siteid : plugin.data.site_id,
				status : plugin.data.status
			},
			success: function(data){
				if ( data.status === 'unauthenticated' ){
					plugin.loading(false);
					plugin.data.status = 'inactive';
					plugin.authenticated = false;
					plugin.resetButtons();
					$(document).trigger('favorites-require-authentication', [plugin.data]);
					return;
				}
				Favorites.userFavorites = data.favorites;
				plugin.loading(false);
				plugin.resetButtons();
				$(document).trigger('favorites-updated-single', [data.favorites, plugin.data.post_id, plugin.data.site_id, plugin.data.status]);

				// Deprecated callback
				favorites_after_button_submit(data.favorites, plugin.data.post_id, plugin.data.site_id, plugin.data.status);
			}
		});
	}

	/*
	* Set the output html
	*/
	plugin.resetButtons = function()
	{
		var favorite_count = parseInt($(plugin.activeButton).attr('data-favoritecount'));

		$.each(plugin.allButtons, function(){
			if ( plugin.data.status === 'inactive' ) {
				if ( favorite_count <= 0 ) favorite_count = 1;
				$(this).removeClass(Favorites.cssClasses.active);
				$(this).attr('data-favoritecount', favorite_count - 1);
				if ( plugin.authenticated ){
					$(this).html(plugin.formatter.addFavoriteCount(Favorites.jsData.favorite, (favorite_count - 1)));
				} else {
					$(this).html(Favorites.jsData.favorite);
				}
				return;
			} 
			$(this).addClass(Favorites.cssClasses.active);
			$(this).attr('data-favoritecount', favorite_count + 1);
			$(this).html(plugin.formatter.addFavoriteCount(Favorites.jsData.favorited, (favorite_count + 1)));
		});
	}

	/*
	* Toggle loading on the button
	*/
	plugin.loading = function(loading)
	{
		if ( loading ){
			$.each(plugin.allButtons, function(){
				$(this).attr('disabled', 'disabled');
				$(this).addClass(Favorites.cssClasses.loading);
				$(this).html(plugin.addLoadingIndication());
			});
			return;
		}
		$.each(plugin.allButtons, function(){
			$(this).attr('disabled', false);
			$(this).removeClass(Favorites.cssClasses.loading);
		});
	}

	/*
	* Add loading indication to button
	*/
	plugin.addLoadingIndication = function(html)
	{
		if ( Favorites.jsData.indicate_loading !== '1' ) return html;
		if ( plugin.data.status === 'active' ) return Favorites.jsData.loading_text + Favorites.jsData.loading_image_active;
		return Favorites.jsData.loading_text + Favorites.jsData.loading_image;
	}

	return plugin.bindEvents();
}
/**
* Updates Favorite Buttons as Needed
*/
var Favorites = Favorites || {};

Favorites.ButtonUpdater = function()
{
	var plugin = this;
	var $ = jQuery;

	plugin.utilities = new Favorites.Utilities;
	plugin.formatter = new Favorites.Formatter;
	plugin.buttonFormatter = new Favorites.ButtonOptionsFormatter;

	plugin.activeButton;
	plugin.data = {};

	plugin.bindEvents = function()
	{
		$(document).on('favorites-user-favorites-loaded', function(){
			plugin.updateAllButtons();
		});
		$(document).on('favorites-cleared', function(){
			plugin.updateAllButtons();
		});
		$(document).on('favorites-updated-single', function(){
			plugin.updateAllButtons();
		});
	}

	/*
	* Update all favorites buttons to match the user favorites
	*/
	plugin.updateAllButtons = function()
	{
		for ( var i = 0; i < $(Favorites.selectors.button).length; i++ ){
			plugin.activeButton = $(Favorites.selectors.button)[i];
			plugin.setButtonData();

			if ( plugin.utilities.isFavorite( plugin.data.postid, plugin.data.site_favorites ) ){
				plugin.buttonFormatter.format($(plugin.activeButton), true);
				$(plugin.activeButton).addClass(Favorites.cssClasses.active);
				$(plugin.activeButton).removeClass(Favorites.cssClasses.loading);
				continue;
			}

			plugin.buttonFormatter.format($(plugin.activeButton), false);
			$(plugin.activeButton).removeClass(Favorites.cssClasses.active);
			$(plugin.activeButton).removeClass(Favorites.cssClasses.loading);
		}
	}

	/**
	* Set the button data
	*/
	plugin.setButtonData = function()
	{
		plugin.data.postid = $(plugin.activeButton).attr('data-postid');
		plugin.data.siteid = $(plugin.activeButton).attr('data-siteid');
		plugin.data.favorite_count = $(plugin.activeButton).attr('data-favoritecount');
		plugin.data.site_index = plugin.utilities.siteIndex(plugin.data.siteid);
		plugin.data.site_favorites = Favorites.userFavorites[plugin.data.site_index].posts;
	}

	return plugin.bindEvents();
}
/**
* Total Favorites Count Updates
*/
var Favorites = Favorites || {};

Favorites.TotalCount = function()
{
	var plugin = this;
	var $ = jQuery;

	plugin.bindEvents = function()
	{
		$(document).on('favorites-updated-single', function(){
			plugin.updateTotal();
		});
		$(document).on('favorites-cleared', function(){
			plugin.updateTotal();
		});
	}

	/*
	* Update Total Number of Favorites
	*/
	plugin.updateTotal = function()
	{
		// Loop through all the total favorite elements
		for ( var i = 0; i < $(Favorites.selectors.total_favorites).length; i++ ){
			var item = $(Favorites.selectors.total_favorites)[i];
			var siteid = parseInt($(item).attr('data-siteid'));
			var posttypes = $(item).attr('data-posttypes');
			var posttypes_array = posttypes.split(','); // Multiple Post Type Support
			var count = 0;

			// Loop through all sites in favorites
			for ( var c = 0; c < Favorites.userFavorites.length; c++ ){
				var site_favorites = Favorites.userFavorites[c];
				if ( site_favorites.site_id !== siteid ) continue; 
				$.each(site_favorites.posts, function(){
					if ( $(item).attr('data-posttypes') === 'all' ){
						count++;
						return;
					}
					if ( $.inArray(this.post_type, posttypes_array) !== -1 ) count++;
				});
			}
			$(item).text(count);
		}
	}

	return plugin.bindEvents();
}
/**
* Favorites Require Authentication
*/
var Favorites = Favorites || {};

Favorites.RequireAuthentication = function()
{
	var plugin = this;
	var $ = jQuery;

	plugin.bindEvents = function()
	{
		$(document).on('favorites-require-authentication', function(){
			plugin.openModal();
		});
		$(document).on('click', '.simplefavorites-modal-backdrop', function(e){
			plugin.closeModal();
		});
		$(document).on('click', '[' + Favorites.selectors.close_modals + ']', function(e){
			e.preventDefault();
			plugin.closeModal();
		});
	}

	/**
	* Open the Moda
	*/
	plugin.openModal = function()
	{
		plugin.buildModal();
		setTimeout(function(){
			$('[' + Favorites.selectors.modals + ']').addClass('active');
		}, 10);
	}

	/**
	* Build the Modal
	*/
	plugin.buildModal = function()
	{
		var modal = $('[' + Favorites.selectors.modals + ']');
		if ( modal.length > 0 ) return;
		var html = '<div class="simplefavorites-modal-backdrop" ' + Favorites.selectors.modals + '></div>';
		html += '<div class="simplefavorites-modal-content" ' + Favorites.selectors.modals + '>';
		html += '<div class="simplefavorites-modal-content-body">';
		html += Favorites.jsData.authentication_modal_content;
		html += '</div><!-- .simplefavorites-modal-content-body -->';
		html += '</div><!-- .simplefavorites-modal-content -->';
		$('body').prepend(html);
	}

	/**
	* Close the Moda
	*/
	plugin.closeModal = function()
	{
		$('[' + Favorites.selectors.modals + ']').removeClass('active');
	}

	return plugin.bindEvents();
}
/**
* Primary Favorites Initialization
* @package Favorites
* @author Kyle Phillips - https://github.com/kylephillips/favorites
*
* Events:
* favorites-nonce-generated: The nonce has been generated
* favorites-updated-single: A user's favorite has been updated. Params: favorites, post_id, site_id, status
* favorites-cleared: The user's favorites have been cleared. Params: clear button
* favorites-user-favorites-loaded: The user's favorites have been loaded. Params: intialLoad (bool)
* favorites-require-authentication: An unauthenticated user has attempted to favorite a post (The Require Login & Show Modal setting is checked)
*/

/**
* Callback Functions for use in themes (deprecated in v2 in favor of events)
*/
function favorites_after_button_submit(favorites, post_id, site_id, status){}
function favorites_after_initial_load(favorites){}

jQuery(document).ready(function(){
	new Favorites.Factory;
});

var Favorites = Favorites || {};

/**
* DOM Selectors Used by the Plugin
*/
Favorites.selectors = {
	button : '.simplefavorite-button', // Favorite Buttons
	list : '.favorites-list', // Favorite Lists
	clear_button : '.simplefavorites-clear', // Clear Button
	total_favorites : '.simplefavorites-user-count', // Total Favorites (from the_user_favorites_count)
	modals : 'data-favorites-modal', // Modals
	close_modals : 'data-favorites-modal-close', // Link/Button to close the modals
}

/**
* CSS Classes Used by the Plugin
*/
Favorites.cssClasses = {
	loading : 'loading', // Loading State
	active : 'active', // Active State
}

/**
* Localized JS Data Used by the Plugin
*/
Favorites.jsData = {
	ajaxurl : favorites_data.ajaxurl, // The WP AJAX URL
	nonce : null, // The Dynamically-Generated Nonce
	favorite : favorites_data.favorite, // Active Button Text/HTML
	favorited : favorites_data.favorited, // Inactive Button Text
	include_count : favorites_data.includecount, // Whether to include the count in buttons
	indicate_loading : favorites_data.indicate_loading, // Whether to include loading indication in buttons
	loading_text : favorites_data.loading_text, // Loading indication text
	loading_image_active : favorites_data.loading_image_active, // Loading spinner url in active button
	loading_image : favorites_data.loading_image, // Loading spinner url in inactive button
	cache_enabled : favorites_data.cache_enabled, // Is cache enabled on the site
	authentication_modal_content : favorites_data.authentication_modal_content, // Content to display in authentication gate modal
	button_options : favorites_data.button_options // Custom button options
}

/**
* The user's favorites
* @var object
*/
Favorites.userFavorites = null;

/**
* WP Form Actions Used by the Plugin
*/
Favorites.formActions = {
	nonce : 'favorites_nonce',
	favoritesarray : 'favorites_array',
	favorite : 'favorites_favorite',
	clearall : 'favorites_clear',
	favoritelist : 'favorites_list'
}

/**
* Primary factory class
*/
Favorites.Factory = function()
{
	var plugin = this;
	var $ = jQuery;

	plugin.build = function()
	{
		new Favorites.NonceGenerator;
		new Favorites.UserFavorites;
		new Favorites.Lists;
		new Favorites.Clear;
		new Favorites.Button;
		new Favorites.ButtonUpdater;
		new Favorites.TotalCount;
		new Favorites.RequireAuthentication;
	}

	return plugin.build();
}