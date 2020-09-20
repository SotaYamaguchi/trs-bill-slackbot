import validator from 'validator';

const isNumeric = (str: string) =>
  validator.isNumeric(str);

export {
  isNumeric,
};