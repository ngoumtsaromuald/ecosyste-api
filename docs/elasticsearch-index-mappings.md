# Elasticsearch Index Mappings Documentation

## Overview

This document describes the Elasticsearch index mappings configuration for the ROMAPI search system. The mappings are designed to support advanced French text search, auto-completion, geographical filtering, and multi-field search with proper relevance scoring.

## Index Configuration

### Settings

#### Analysis Configuration

**French Analyzer (`french_analyzer`)**
- **Purpose**: Primary analyzer for French text content
- **Tokenizer**: `standard`
- **Filters**:
  - `lowercase`: Converts text to lowercase
  - `asciifolding`: Removes accents (café → cafe)
  - `french_elision`: Handles French contractions (l'eau → eau)
  - `french_stemmer`: French stemming (restaurants → restaurant)
  - `french_stop`: Removes French stop words (le, la, les, etc.)

**French Search Analyzer (`french_search_analyzer`)**
- **Purpose**: Enhanced analyzer for search queries with synonyms
- **Additional Filter**: `french_synonym` for synonym expansion
- **Synonyms**:
  - `api,interface,service,webservice`
  - `entreprise,société,compagnie,business`
  - `restaurant,resto,brasserie,café`
  - And more...

**Autocomplete Analyzer (`autocomplete_analyzer`)**
- **Purpose**: Edge n-gram analysis for autocomplete functionality
- **Filter**: `autocomplete_filter` (edge_ngram: 2-20 characters)

**Suggest Analyzer (`suggest_analyzer`)**
- **Purpose**: Keyword-based analysis for completion suggester
- **Tokenizer**: `keyword`
- **Filters**: `lowercase`, `asciifolding`

### Field Mappings

#### Core Fields

**`name` Field**
```json
{
  "type": "text",
  "analyzer": "french_analyzer",
  "search_analyzer": "french_search_analyzer",
  "boost": 3.0,
  "fields": {
    "keyword": { "type": "keyword" },
    "suggest": {
      "type": "completion",
      "analyzer": "suggest_analyzer",
      "contexts": [
        { "name": "category", "type": "category" },
        { "name": "resource_type", "type": "category" }
      ]
    },
    "autocomplete": {
      "type": "text",
      "analyzer": "autocomplete_analyzer",
      "search_analyzer": "autocomplete_search_analyzer"
    },
    "exact": {
      "type": "keyword",
      "normalizer": "lowercase_normalizer"
    }
  }
}
```

**Boost Values**:
- `name`: 3.0 (highest priority)
- `category.name`: 2.5 (high priority)
- `description`: 2.0 (medium priority)
- `tags`: 1.5 (lower priority)

#### Geographical Fields

**`location` Field**
```json
{
  "type": "geo_point"
}
```

**`address` Object**
```json
{
  "type": "object",
  "properties": {
    "street": { "type": "text", "analyzer": "french_analyzer" },
    "city": { "type": "keyword" },
    "region": { "type": "keyword" },
    "country": { "type": "keyword" },
    "postalCode": { "type": "keyword" }
  }
}
```

#### Category and Classification

**`category` Object**
```json
{
  "type": "object",
  "properties": {
    "id": { "type": "keyword" },
    "name": {
      "type": "text",
      "analyzer": "french_analyzer",
      "boost": 2.5,
      "fields": { "keyword": { "type": "keyword" } }
    },
    "slug": { "type": "keyword" },
    "hierarchy": { "type": "keyword" },
    "path": { "type": "text", "analyzer": "keyword" }
  }
}
```

## Usage Examples

### 1. Basic Text Search

```javascript
// Search with French text analysis
{
  "query": {
    "multi_match": {
      "query": "restaurant français",
      "fields": ["name^3", "description^2", "category.name^2.5", "tags^1.5"],
      "type": "best_fields",
      "fuzziness": "AUTO"
    }
  }
}
```

### 2. Autocomplete Search

```javascript
// Autocomplete functionality
{
  "query": {
    "match": {
      "name.autocomplete": {
        "query": "rest",
        "analyzer": "autocomplete_search_analyzer"
      }
    }
  }
}
```

### 3. Completion Suggester

```javascript
// Contextual suggestions
{
  "suggest": {
    "name_suggest": {
      "prefix": "rest",
      "completion": {
        "field": "name.suggest",
        "contexts": {
          "category": ["food", "hospitality"],
          "resource_type": ["api", "service"]
        }
      }
    }
  }
}
```

### 4. Geographical Search

```javascript
// Search within radius
{
  "query": {
    "bool": {
      "must": [
        { "match": { "name": "restaurant" } }
      ],
      "filter": [
        {
          "geo_distance": {
            "distance": "5km",
            "location": {
              "lat": 4.0511,
              "lon": 9.7679
            }
          }
        }
      ]
    }
  },
  "sort": [
    {
      "_geo_distance": {
        "location": { "lat": 4.0511, "lon": 9.7679 },
        "order": "asc",
        "unit": "km"
      }
    }
  ]
}
```

## Performance Considerations

### Index Settings
- **Shards**: 1 (suitable for small to medium datasets)
- **Replicas**: 0 (development), 1+ (production)
- **Refresh Interval**: 1s (near real-time)
- **Max Result Window**: 50,000 (for deep pagination)

### Search Optimization
- **Boost Values**: Carefully tuned for relevance
- **Fuzziness**: AUTO for typo tolerance
- **Synonym Expansion**: Context-aware synonyms
- **Edge N-grams**: Efficient autocomplete (2-20 chars)

## Maintenance

### Index Management Commands

```bash
# Initialize all indices
npm run indices:init

# Check index health
npm run indices:health

# Test index functionality
npm run indices:test romapi_resources

# Check cluster health
npm run indices:cluster
```

### Monitoring

Monitor these metrics:
- Index size and document count
- Search latency and throughput
- Analyzer performance
- Suggestion accuracy

### Updates

When updating mappings:
1. Only new fields can be added to existing indices
2. For mapping changes, create new index and reindex
3. Use aliases for zero-downtime updates
4. Test mappings in development first

## Troubleshooting

### Common Issues

**1. French Text Not Analyzed Properly**
- Check `french_analyzer` configuration
- Verify `french_elision` and `french_stemmer` filters
- Test with sample French text

**2. Autocomplete Not Working**
- Verify `autocomplete_analyzer` setup
- Check edge n-gram filter configuration
- Ensure proper search analyzer usage

**3. Suggestions Not Contextual**
- Check completion field contexts
- Verify context values in documents
- Test suggester with context filters

**4. Poor Search Relevance**
- Review boost values
- Check synonym configuration
- Analyze query structure and field weights

### Debug Commands

```bash
# Test analyzer
curl -X POST "localhost:9200/romapi_resources/_analyze" -H 'Content-Type: application/json' -d'
{
  "analyzer": "french_analyzer",
  "text": "Restaurant français à Douala"
}'

# Check mapping
curl -X GET "localhost:9200/romapi_resources/_mapping"

# Index health
curl -X GET "localhost:9200/_cluster/health/romapi_resources"
```