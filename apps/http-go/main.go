package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	_ "github.com/lib/pq"
)

var db *sql.DB

type Website struct {
	ID        string `json:"id"`
	URL       string `json:"url"`
	TimeAdded string `json:"timeAdded"`
}

type WebsiteTick struct {
	ID        string `json:"id"`
	WebsiteID string `json:"website_id"`
	Status    string `json:"status"`
	Timestamp string `json:"timestamp"`
}

func hello(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "Hello from Go")
}

func createWebsite(w http.ResponseWriter, r *http.Request) {
	var input struct {
		URL string `json:"url"`
	}

	err := json.NewDecoder(r.Body).Decode(&input)
	if err != nil || input.URL == "" {
		http.Error(w, `{"message":"Missing url"}`,http.StatusLengthRequired)
		return
	}

	var id string
	err = db.QueryRow(`
		INSERT INTO website (url, time_added)
		VALUES ($1, NOW())
		RETURNING id
	`, input.URL).Scan(&id)

	if err != nil {
		log.Printf("DB insert error: %v", err)
		http.Error(w, `{"message":"Failed to insert website"}`, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"id": id})
}

func getStatus(w http.ResponseWriter, r *http.Request) {
	websiteId := r.URL.Path[len("/status/"):]
	var tick WebsiteTick

	err := db.QueryRow(`
		SELECT id, website_id, status, timestamp
		FROM website_tick
		WHERE website_id = $1
		LIMIT 1
	`, websiteId).Scan(&tick.ID, &tick.WebsiteID, &tick.Status, &tick.Timestamp)

	if err != nil {
		if err == sql.ErrNoRows {
			json.NewEncoder(w).Encode(map[string]string{"message": "No status found"})
			return
		}
		http.Error(w,"Internal server error", 500)
		return
	}

	json.NewEncoder(w).Encode(tick)
}

func main() {
	dsn := "postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable"
	var err error
	db, err = sql.Open("postgres", dsn)

	if err != nil {
		log.Fatalf("xant connect %v", err)
	}
	defer db.Close()

	_, err = db.Exec(`
    CREATE TABLE IF NOT EXISTS website (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        time_added TIMESTAMP NOT NULL DEFAULT NOW()
    )
`)
	log.Printf("DB created: %v", err)

	http.HandleFunc("/", hello)
	http.HandleFunc("/website", createWebsite)
	http.HandleFunc("/status/", getStatus)

	http.ListenAndServe(":3000", nil)
}
