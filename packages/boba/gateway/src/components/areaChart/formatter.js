export const dataFormatter = (number) => {
  if (number > 1000000000) {
    return (number / 999999999).toString() + 'B';
  } else if (number > 1000000) {
    return (number / 999999).toString() + 'M';
  } else if (number > 999) {
    return (number / 1000).toString() + 'K';
  } else {
    return number.toString();
  }
}
