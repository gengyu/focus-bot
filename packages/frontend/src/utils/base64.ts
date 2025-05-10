export const getBase64String = (base64: string,mineType: string)=> {
  const getBase64Prefix = (mineType: string) => {
    switch (mineType) {
      case 'image/jpeg':
        return 'data:image/jpeg;base64,';
      case 'image/png':
        return 'data:image/png;base64,';
      case 'image/gif':
        return 'data:image/gif;base64,';
      case 'image/webp':
        return 'data:image/webp;base64,';
      case 'image/bmp':
        return 'data:image/bmp;base64,';
    }
  }
  return getBase64Prefix(mineType) + base64;
};