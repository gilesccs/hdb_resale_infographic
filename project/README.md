## Updating HDB Resale Data

To update the HDB resale data:

1. Run the following command in the `/project` directory:
   ```
   npm run update-hdb-data
   ```
2. This will fetch the latest data from data.gov.sg and save it to `public/propertyData.json`.
3. Commit and push the updated `propertyData.json` to your repository.
4. Redeploy your site on Netlify.

*Note: You should update the data periodically (e.g., monthly) to keep your site current.* 