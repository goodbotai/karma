const {http} = require('borq');

http.request('https://sentry.onalabs.org/api/0/projects/ona/karma/issues/?query=is:resolved',
             {
               method: 'GET',
               headers: {'Authorization': 'Bearer 5b7b1ebe733e416d90eaa59c0f1aeeb33b1bf04920fd4f7f8bac006aa35428c1'}
             })
  .then(arr => {
    arr.map(({id}) => {
      http.request(`https://sentry.onalabs.org/api/0/projects/ona/karma/issues?id=${id}`,
                   {
                     method: 'DELETE',
                     headers: {'Authorization': 'Bearer 5b7b1ebe733e416d90eaa59c0f1aeeb33b1bf04920fd4f7f8bac006aa35428c1'}
                   })
        .then(res => console.log(`Deleted ${id}
Res ${res}`));
    });
  });
