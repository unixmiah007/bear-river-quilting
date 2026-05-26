import { useFavorites } from '../context/FavoritesContext.jsx';

export default function FavoriteProductButton({
  productId,
  productName,
  className = '',
  variant = 'full',
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(productId);
  const label = active
    ? `Remove ${productName} from favorites`
    : `Save ${productName} to favorites`;

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(productId);
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        className={`product-favorite-icon${active ? ' product-favorite-icon--active' : ''}${className ? ` ${className}` : ''}`}
        aria-pressed={active}
        aria-label={label}
        title={active ? 'Remove from favorites' : 'Add to favorites'}
        onClick={handleClick}
      >
        <span aria-hidden="true">{active ? '♥' : '♡'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`btn product-favorite-btn${active ? ' product-favorite-btn--active' : ''}${className ? ` ${className}` : ''}`}
      aria-pressed={active}
      aria-label={label}
      title={active ? 'Remove from favorites' : 'Add to favorites'}
      onClick={handleClick}
    >
      <span className="product-favorite-btn__icon" aria-hidden="true">
        {active ? '♥' : '♡'}
      </span>
      {active ? 'Saved to favorites' : 'Add to favorites'}
    </button>
  );
}
