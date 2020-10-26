import axios from 'axios';
import adapter from 'axios/lib/adapters/http';

describe('/health', () => {
    const healthUrl = `${process.env.SERVICE_URL}/health`;
    it('should return 200', () => {
        return expect(
            axios.get(healthUrl, {
                adapter
            })
        ).resolves.toEqual(expect.objectContaining({ status: 200 }));
    });

    it('health endpoint returns matching data', async () => {
        return expect(
            axios.get(healthUrl, {
                adapter
            })
        ).resolves.toEqual(
            expect.objectContaining({
                data: expect.objectContaining({
                    details: expect.objectContaining({
                        database: expect.objectContaining({
                            writable: true
                        })
                    })
                })
            })
        );
    });
});
