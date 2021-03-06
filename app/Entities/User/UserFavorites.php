<?php 
namespace Favorites\Entities\User;

use Favorites\Entities\User\UserRepository;
use Favorites\Entities\Favorite\FavoriteFilter;
use Favorites\Helpers;
use Favorites\Entities\Favorite\FavoriteButton;
use Favorites\Config\SettingsRepository;

class UserFavorites 
{
	/**
	* User ID
	* @var int
	*/
	private $user_id;

	/**
	* Site ID
	* @var int
	*/
	private $site_id;

	/**
	* Display Links
	* @var boolean
	*/
	private $links;

	/**
	* Filters
	* @var array
	*/
	private $filters;

	/**
	* User Repository
	*/
	private $user_repo;

	/**
	* Settings Repository
	*/
	private $settings_repo;

	public function __construct($user_id = null, $site_id = null, $links = false, $filters = null)
	{
		$this->user_id = $user_id;
		$this->site_id = $site_id;
		$this->links = $links;
		$this->filters = $filters;
		$this->user_repo = new UserRepository;
		$this->settings_repo = new SettingsRepository;
	}

	/**
	* Get an array of favorites for specified user
	*/
	public function getFavoritesArray()
	{
		$favorites = $this->user_repo->getFavorites($this->user_id, $this->site_id);
		if ( isset($this->filters) && is_array($this->filters) ) $favorites = $this->filterFavorites($favorites);
		return $this->removeInvalidFavorites($favorites);
	}

	/**
	* Remove non-existent or non-published favorites
	* @param array $favorites
	*/
	private function removeInvalidFavorites($favorites)
	{
		foreach($favorites as $key => $favorite){
			if ( !$this->postExists($favorite) ) unset($favorites[$key]);
		}
		return $favorites;
	}

	/**
	* Filter the favorites
	* @since 1.1.1
	* @param array $favorites
	*/
	private function filterFavorites($favorites)
	{
		$favorites = new FavoriteFilter($favorites, $this->filters);
		return $favorites->filter();
	}	

	/**
	* Return an HTML list of favorites for specified user
	* @param $include_button boolean - whether to include the favorite button
	* @param $include_thumbnails boolean - whether to include post thumbnails
	* @param $thumbnail_size string - thumbnail size to display
	* @param $include_excerpt boolean - whether to include the post excerpt
	*/
	public function getFavoritesList($include_button = false, $include_thumbnails = false, $thumbnail_size = 'thumbnail', $include_excerpt = false)
	{
		if ( is_null($this->site_id) || $this->site_id == '' ) $this->site_id = get_current_blog_id();
		
		$favorites = $this->getFavoritesArray();
		$no_favorites = $this->settings_repo->noFavoritesText();
		$favorites = ( isset($favorites[0]['site_id']) ) ? $favorites[0]['posts'] : $favorites;

		// Post Type filters for data attr
		$post_types = '';
		if ( isset($this->filters['post_type']) ){
			$post_types = implode(',', $this->filters['post_type']);
		}
		
		if ( is_multisite() ) switch_to_blog($this->site_id);
		
		$out = '<ul class="favorites-list" data-userid="' . $this->user_id . '" data-links="true" data-siteid="' . $this->site_id . '" ';
		$out .= ( $include_button ) ? 'data-includebuttons="true"' : 'data-includebuttons="false"';
		$out .= ( $this->links ) ? ' data-includelinks="true"' : ' data-includelinks="false"';
		$out .= ( $include_thumbnails ) ? ' data-includethumbnails="true"' : ' data-includethumbnails="false"';
		$out .= ( $include_excerpt ) ? ' data-includeexcerpts="true"' : ' data-includeexcerpts="false"';
		$out .= ' data-thumbnailsize="' . $thumbnail_size . '"';
		$out .= ' data-nofavoritestext="' . $no_favorites . '"';
		$out .= ' data-posttype="' . $post_types . '"';
		$out .= '>';

		if ( empty($favorites) ) $out .= '<li data-postid="0" data-nofavorites>' . $no_favorites . '</li>';
		if ( !empty($favorites) ) :
			foreach ( $favorites as $key => $favorite ){
				$out .= '<li data-postid="' . $favorite . '">';
				if ( $include_thumbnails ) {
					$thumb_url = get_the_post_thumbnail_url($favorite, $thumbnail_size);
					if ( $thumb_url ){
						$img = '<img src="' . $thumb_url . '" alt="' . get_the_title($favorite) . '" class="favorites-list-thumbnail" />';
						$out .= apply_filters('favorites/list/thumbnail', $img, $favorite, $thumbnail_size);
					};
				}
				if ( $this->links ) $out .= '<p><a href="' . get_permalink($favorite) . '">';
				$out .= get_the_title($favorite);
				if ( $this->links ) $out .= '</a></p>';
				if ( $include_excerpt ) {
					$excerpt = apply_filters('the_excerpt', get_post_field('post_excerpt', $favorite));
					if ( $excerpt ) $out .= '<p class="excerpt">' . apply_filters('favorites/list/excerpt', $excerpt) . '</p>';
				}
				if ( $include_button ){
					$button = new FavoriteButton($favorite, $this->site_id);
					$out .= '<p>' . $button->display(false) . '</p>';
				}
				$out .= '</li>';
			}
		endif;
		$out .= '</ul>';
		if ( is_multisite() ) restore_current_blog();
		return $out;
	}

	/**
	* Check if post exists and is published
	*/
	private function postExists($id)
	{
		$status = get_post_status($id);
		return( !$status || $status !== 'publish') ? false : true;
	}
}