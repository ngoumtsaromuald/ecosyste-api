FROM docker.elastic.co/elasticsearch/elasticsearch:8.11.0

# Install the analysis-icu plugin
RUN bin/elasticsearch-plugin install analysis-icu

# Copy custom configuration
COPY elasticsearch.yml /usr/share/elasticsearch/config/elasticsearch.yml

# Set proper permissions
USER elasticsearch