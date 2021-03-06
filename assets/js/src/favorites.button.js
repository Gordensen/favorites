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