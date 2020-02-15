package service

import (
	"crypto/rand"
	"encoding/hex"
)

type CSRFService struct {
	tokens map[CSRFToken]CSRFToken
}

type CSRFToken string

func NewCSRFService() *CSRFService {
	return &CSRFService{
		tokens: map[CSRFToken]CSRFToken{},
	}
}

func makeToken() CSRFToken {
	token := make([]byte, 32)
	_, _ = rand.Read(token)

	return CSRFToken(hex.EncodeToString(token))
}

func (cs *CSRFService) NewToken() CSRFToken {
	token := makeToken()
	cs.tokens[token] = token
	return token
}

func (cs CSRFService) IsValid(token CSRFToken) bool {
	_, found := cs.tokens[token]
	return found
}
