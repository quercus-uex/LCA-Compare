import {
  ADMIN_MAX_TAKE,
  parseAdminPagination,
} from './admin-pagination.helpers';

describe('parseAdminPagination', () => {
  it('parses valid values', () => {
    expect(parseAdminPagination('10', '15')).toEqual({ skip: 10, take: 15 });
  });

  it('leaves missing values undefined', () => {
    expect(parseAdminPagination()).toEqual({
      skip: undefined,
      take: undefined,
    });
  });

  it('ignores non-numeric, negative and decimal values', () => {
    expect(parseAdminPagination('abc', '-1')).toEqual({
      skip: undefined,
      take: undefined,
    });
    expect(parseAdminPagination('1.5', '')).toEqual({
      skip: undefined,
      take: undefined,
    });
  });

  it('caps take', () => {
    expect(parseAdminPagination('0', '5000').take).toBe(ADMIN_MAX_TAKE);
  });
});
