export const marketplaceBasePath = (role) => {
  if (role === 'buyer') {
    return '/buyer/marketplace';
  }
  return '/app/marketplace';
};