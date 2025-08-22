import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ResourceType } from '@prisma/client';

describe('Multi-Type Search (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/api/v1/search/multi-type (GET)', () => {
    it('should return multi-type search results', () => {
      return request(app.getHttpServer())
        .get('/api/v1/search/multi-type')
        .query({ q: 'test' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('resultsByType');
          expect(res.body).toHaveProperty('combinedResults');
          expect(res.body).toHaveProperty('totalAcrossTypes');
          expect(res.body).toHaveProperty('globalFacets');
          expect(res.body).toHaveProperty('took');
        });
    });

    it('should filter by specific resource types', () => {
      return request(app.getHttpServer())
        .get('/api/v1/search/multi-type')
        .query({ 
          q: 'test',
          includeTypes: `${ResourceType.API},${ResourceType.SERVICE}`
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.resultsByType).toHaveProperty(ResourceType.API);
          expect(res.body.resultsByType).toHaveProperty(ResourceType.SERVICE);
          expect(res.body.metadata.searchedTypes).toContain(ResourceType.API);
          expect(res.body.metadata.searchedTypes).toContain(ResourceType.SERVICE);
        });
    });

    it('should handle empty query', () => {
      return request(app.getHttpServer())
        .get('/api/v1/search/multi-type')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('resultsByType');
          expect(res.body).toHaveProperty('totalAcrossTypes');
        });
    });
  });

  describe('/api/v1/search/multi-type/distribution (GET)', () => {
    it('should return type distribution', () => {
      return request(app.getHttpServer())
        .get('/api/v1/search/multi-type/distribution')
        .query({ q: 'test' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty(ResourceType.API);
          expect(res.body).toHaveProperty(ResourceType.SERVICE);
          expect(res.body).toHaveProperty(ResourceType.BUSINESS);
          expect(res.body).toHaveProperty(ResourceType.DATA);
          
          // All values should be numbers
          Object.values(res.body).forEach(count => {
            expect(typeof count).toBe('number');
            expect(count).toBeGreaterThanOrEqual(0);
          });
        });
    });
  });

  describe('/api/v1/search/type/:resourceType (GET)', () => {
    it('should search specific resource type with context', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/search/type/${ResourceType.API}`)
        .query({ q: 'test' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('hits');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('facets');
          expect(res.body.metadata).toHaveProperty('searchedType', ResourceType.API);
          expect(res.body.metadata).toHaveProperty('isMultiTypeContext', true);
        });
    });

    it('should return 400 for invalid resource type', () => {
      return request(app.getHttpServer())
        .get('/api/v1/search/type/INVALID_TYPE')
        .query({ q: 'test' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid resource type');
        });
    });
  });

  describe('/api/v1/search/multi-type/export (GET)', () => {
    it('should export results in JSON format', () => {
      return request(app.getHttpServer())
        .get('/api/v1/search/multi-type/export')
        .query({ 
          q: 'test',
          exportTypes: `${ResourceType.API},${ResourceType.SERVICE}`,
          format: 'json'
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty(ResourceType.API);
          expect(res.body).toHaveProperty(ResourceType.SERVICE);
          
          if (res.body[ResourceType.API]) {
            expect(res.body[ResourceType.API]).toHaveProperty('data');
            expect(res.body[ResourceType.API]).toHaveProperty('count');
            expect(res.body[ResourceType.API]).toHaveProperty('format', 'json');
          }
        });
    });

    it('should export results in CSV format', () => {
      return request(app.getHttpServer())
        .get('/api/v1/search/multi-type/export')
        .query({ 
          q: 'test',
          exportTypes: ResourceType.API,
          format: 'csv'
        })
        .expect(200)
        .expect((res) => {
          if (res.body[ResourceType.API] && res.body[ResourceType.API].data.length > 0) {
            const csvData = res.body[ResourceType.API].data[0];
            expect(csvData).toHaveProperty('ID');
            expect(csvData).toHaveProperty('Nom');
            expect(csvData).toHaveProperty('Type');
          }
        });
    });

    it('should return 400 when exportTypes is missing', () => {
      return request(app.getHttpServer())
        .get('/api/v1/search/multi-type/export')
        .query({ q: 'test' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Export types are required');
        });
    });
  });

  describe('Filter Persistence', () => {
    const sessionId = 'test-session-123';

    describe('/api/v1/search/filters/save (POST)', () => {
      it('should save filters for a session', () => {
        return request(app.getHttpServer())
          .post('/api/v1/search/filters/save')
          .set('x-session-id', sessionId)
          .send({
            filters: {
              categories: ['cat1'],
              resourceTypes: [ResourceType.API],
              verified: true
            },
            activeTab: ResourceType.API,
            searchQuery: 'test query'
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('sauvegardés');
          });
      });

      it('should return 400 when session ID is missing', () => {
        return request(app.getHttpServer())
          .post('/api/v1/search/filters/save')
          .send({
            filters: { verified: true }
          })
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toContain('Session ID is required');
          });
      });
    });

    describe('/api/v1/search/filters/load (GET)', () => {
      it('should load saved filters for a session', () => {
        return request(app.getHttpServer())
          .get('/api/v1/search/filters/load')
          .set('x-session-id', sessionId)
          .expect(200);
      });

      it('should return 400 when session ID is missing', () => {
        return request(app.getHttpServer())
          .get('/api/v1/search/filters/load')
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toContain('Session ID is required');
          });
      });
    });

    describe('/api/v1/search/filters/tab (PUT)', () => {
      it('should update active tab', () => {
        return request(app.getHttpServer())
          .put('/api/v1/search/filters/tab')
          .set('x-session-id', sessionId)
          .send({ activeTab: ResourceType.SERVICE })
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      });

      it('should return 400 for invalid resource type', () => {
        return request(app.getHttpServer())
          .put('/api/v1/search/filters/tab')
          .set('x-session-id', sessionId)
          .send({ activeTab: 'INVALID_TYPE' })
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toContain('Invalid resource type');
          });
      });
    });

    describe('/api/v1/search/filters/clear (DELETE)', () => {
      it('should clear saved filters', () => {
        return request(app.getHttpServer())
          .delete('/api/v1/search/filters/clear')
          .set('x-session-id', sessionId)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      });
    });

    describe('/api/v1/search/filters/history (GET)', () => {
      it('should get filter history', () => {
        return request(app.getHttpServer())
          .get('/api/v1/search/filters/history')
          .set('x-session-id', sessionId)
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      });
    });

    describe('/api/v1/search/filters/popular (GET)', () => {
      it('should get popular filters', () => {
        return request(app.getHttpServer())
          .get('/api/v1/search/filters/popular')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      });
    });

    describe('/api/v1/search/multi-type/with-persistence (GET)', () => {
      it('should perform search with persisted filters', () => {
        return request(app.getHttpServer())
          .get('/api/v1/search/multi-type/with-persistence')
          .set('x-session-id', sessionId)
          .query({ q: 'test' })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('resultsByType');
            expect(res.body).toHaveProperty('combinedResults');
            expect(res.body).toHaveProperty('totalAcrossTypes');
          });
      });

      it('should work without session ID', () => {
        return request(app.getHttpServer())
          .get('/api/v1/search/multi-type/with-persistence')
          .query({ q: 'test' })
          .expect(200);
      });
    });
  });
});