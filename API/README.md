## Caching Strategy Summary

This table outlines recommended caching strategies for different types of data in the application.

| Data Type                            | Cache?                | Notes                                                               |
| ------------------------------------ | --------------------- | ------------------------------------------------------------------- |
| **Gallery Projects**                 | ✅ Yes                | High traffic; cache with 1-hour TTL to reduce load.                 |
| **Individual Projects by ID**        | ❌ No (unless needed) | Cache only if accessed frequently to avoid stale data.              |
| **Public User Profiles**             | ✅ Yes                | Cache with 5–10 minute TTL to balance freshness and performance.    |
| **Authenticated User Data**          | ❌ No                 | Data may change frequently; best to avoid caching for accuracy.     |
| **Likes, Comments, Bookmarks**       | ❌ No                 | Dynamic data; caching could lead to outdated information.           |
| **Animations List**                  | ✅ Yes                | Cache if frequently accessed for gallery or previews.               |
| **Individual Frames**                | ❌ No                 | Low chance of repeated requests for individual frames.              |
| **Static Data (e.g., Destinations)** | ✅ Yes                | Cache with a long TTL (e.g., 24 hours) due to low update frequency. |

### Caching Notes:

- **TTL (Time-To-Live)**: Recommended expiration times vary based on data type to ensure freshness and minimize database load.
- **Invalidate on Updates**: For data that changes (e.g., a project or user profile update), consider invalidating the cache to keep data accurate.
