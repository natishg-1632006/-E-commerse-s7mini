const runMiddleware = async (req, res, next, middlewares) => {
  for (const middleware of middlewares) {
    await new Promise((resolve) => {
      let resolved = false;
      const originalStatus = res.status;
      const originalJson = res.json;
      
      const done = () => {
        if (!resolved) {
          resolved = true;
          res.status = originalStatus;
          res.json = originalJson;
          resolve();
        }
      };
      
      res.status = jest.fn().mockImplementation((code) => {
        originalStatus(code);
        done();
        return res;
      });
      
      res.json = jest.fn().mockImplementation((data) => {
        originalJson(data);
        done();
        return res;
      });

      middleware(req, res, (err) => {
        done();
      });
    });
    if (res.status.mock.calls.length > 0) break;
  }
};
module.exports = { runMiddleware };
