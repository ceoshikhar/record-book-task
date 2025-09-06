# Record Book

> I would have deployed the NextJS app for quick testing but because we have to spin up our own WebSocket server for real-time updates, we will have to run it locally.

## Run it locally

1. First make sure to install all dependencies.

```bash
npm install
```

2. Start the WebSocket server.

> It just echos back the message from the client.

```bash
node websocket-server.js
```

3. Build the NextJS app for production so that we have best performance.

```bash
npm run build
```

4. Start the NextJS server.

```bash
npm run start
```

Visit http://localhost:3000

## Learn more

> "A short document (max 1 page)" - consider the part below as this "Short document".

I tried to follow the mentioned libraries/tools in the assignemnt to match the requirements as close as possible.

### Dataset API

I created an API route that returns the rows and colDefs needed to render the table. The rows are capped at 300k and cols at 300.

### Table

AG Grid was mentioned, so I used it. This was the first time I used this library.

Although it was mentioned that we could do a custom implementation, a true custom implementation of virtualized rows and columns rendering in a table might be impossible. But if it meant using something else other than AG Grid and then combine those tools to build our own stuff then I would have gone with something from TanStack - ReactTable, ReactVirtualized and probable ReactQuery.

### Table data fetching from API

ReactQuery was mentioned in the assignment doc, as I was trying out different ways to render AG Grid for infinite scrolling (2d), initially there was a usecase for ReactQuery but then I later settled with the onGridReady API where we set the `dataSource` with a `getRows` function, then AG Grid took care of managing the rows data.

### Virtualiztion

AG Grid is doing all the heavy lifting for performance. Rows and Columns are virtualized. We load more rows when we reach the bottom of the table and more cols when we reach the right end of the table.

Buffer is explicitly set to `10` for rows but for cols there was no API with AG Grid but I believe it's rendering 3 extra cols outside the viewport.

### Performance Tracking

Made use of Redux Toolkit for a store/slice for the state that was being tracked for performance.

Initial thought I had was to use Context but then I thought it might hinder the performance if the entire Grid might start to re-render unnecessarily when the perf state was chaning and as ReduxToolkit was mentioned, I used it. Although I usually go for something like Zustand.

### Real‑time Updates

Created a simple Node WebSocket server that recieves update events from a client and then it broadcasts it to all connected clients.

Again, AG Grid provided APIs to update a cell and show a flash when we updated that cell.

### Loading skeleton

The initial render shows an empty table. I would have preferred to find a way to generate "fake" rows and cols (leading to fake cells) and shown the skeleton.

But when more rows are loading, there is a loading skeleton shown in the cells that are still loading.

But when more cols are loaded, then we have to "backfill" the rows that we have already rendered with the data of the new cols we just fetched so I did that by just refreshing the cache data which leads to the entire table (all cells) showing loading skeleton until the data is loaded.

I don't think this the best UX, I'd have prefered to show only the new cols to show loading skeleton as the cols for the earlier rows already have data. I probably couldn't find the correct AG Grid API to do the backfilling correctly.
