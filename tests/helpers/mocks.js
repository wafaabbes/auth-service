module.exports = {
    mockRequest: (overrides = {}) => ({
      headers: {},
      user: null,
      ...overrides
    }),
    mockResponse: () => {
      const res = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    }
  };