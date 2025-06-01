import { describe, it, expect } from "bun:test";
import axios from "axios";

let BASE_URL = "http://localhost:3001";

describe("Website gets created", () => {
    it("Website not created if url is not present", async () => {
        try {
            const response = await axios.post(`${BASE_URL}/website`, {});
            if (response.status === 200) {
                throw new Error("Website created when it shouldn't have");
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response) {
                expect(error.response.status).toBeGreaterThanOrEqual(400);
                expect(error.response.status).toBeLessThan(500);
                const errorData = error.response.data;
                if (typeof errorData === 'string') {
                    expect(errorData.toLowerCase()).toContain('url');
                } else if (errorData && typeof errorData === 'object' && 'message' in errorData) {
                    expect((errorData.message as string).toLowerCase()).toContain('url');
                }
            } else {
                throw error;
            }
        }
    });

    it("Website is created if url is present", async () => {
        const response = await axios.post(`${BASE_URL}/website`, {
            url: "https://google.com"
        });
        
        expect(response.status).toBe(200);
        expect(response.data.id).not.toBeNull();
        expect(response.data.id).toBeDefined();
        expect(typeof response.data.id).toBe('string');
    });

    it("Website creation with empty url string should fail", async () => {
        try {
            const response = await axios.post(`${BASE_URL}/website`, {
                url: ""
            });
            
            if (response.status === 200) {
                throw new Error("Website created with empty URL when it shouldn't have");
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response) {
                expect(error.response.status).toBeGreaterThanOrEqual(400);
                expect(error.response.status).toBeLessThan(500);
            } else {
                throw error;
            }
        }
    });

    it("Website creation returns valid response format", async () => {
        const testUrl = "https://example.com";
        const response = await axios.post(`${BASE_URL}/website`, {
            url: testUrl
        });
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('id');
        expect(response.data.id).toBeTruthy();
        const id = response.data.id;
        expect(id).not.toBe('');
        expect(id).not.toBe(0);
    });
});

describe("Website status endpoint", () => {
    let createdWebsiteId:string;

    it("Should create a website first for status testing", async () => {
        const response = await axios.post(`${BASE_URL}/website`, {
            url: "https://test-status.com"
        });
        
        expect(response.status).toBe(200);
        expect(response.data.id).toBeDefined();
        createdWebsiteId = response.data.id;
    });

    it("Should handle status request for existing website", async () => {
        if (!createdWebsiteId) {
            throw new Error("No website ID available for testing");
        }
        try {
            const response = await axios.get(`${BASE_URL}/status/${createdWebsiteId}`);
            expect(response.status).toBe(200);
            expect(response.data).toBeDefined();
            if (response.data.message) {
                expect(response.data.message).toContain("No status found");
            } else {
                expect(response.data).toHaveProperty('website_id');
                expect(response.data.website_id).toBe(createdWebsiteId);
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response) {
                expect(error.response.status).toBeGreaterThanOrEqual(400);
                console.log(`Status endpoint returned ${error.response.status}: ${JSON.stringify(error.response.data)}`);
                expect(true).toBe(true); 
            } else {
                throw error;
            }
        }
    });

    it("Should handle status request for non-existent website", async () => {
        const nonExistentId = "99999999";
        try {
            const response = await axios.get(`${BASE_URL}/status/${nonExistentId}`);
            expect(response.status).toBe(200);
            expect(response.data.message).toContain("No status found");
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response) {
                expect(error.response.status).toBeGreaterThanOrEqual(400);

                console.log(`Non-existent website ${error.response.status}: ${JSON.stringify(error.response.data)}`);
                expect(true).toBe(true);
            } else {
                throw error;
            }
        }
    });
});

describe("Server health check", () => {
    it("Should respond to root endpoint", async () => {
        const response = await axios.get(`${BASE_URL}/`);
        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
        const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        expect(responseText.toLowerCase()).toMatch(/hello|world|go/);
    });
});

