package service

import (
	"errors"
	"regexp"
	"strings"
)

var r1 *regexp.Regexp = regexp.MustCompile(`\.{2,}`)
var r2 *regexp.Regexp = regexp.MustCompile(`\\`)
var r3 *regexp.Regexp = regexp.MustCompile(`\/`)
var r4 *regexp.Regexp = regexp.MustCompile(`[^a-zA-Z0-9àâäéèëêìïîùûüÿŷ\s-_\.]`)
var r5 *regexp.Regexp = regexp.MustCompile(`\s+`)

func SanitizeNotebookName(name string) (string, error) {

	name = r1.ReplaceAllString(name, ".")
	name = r2.ReplaceAllString(name, "_")
	name = r3.ReplaceAllString(name, "_")
	name = r4.ReplaceAllString(name, "")
	name = r5.ReplaceAllString(name, " ")
	name = strings.TrimSpace(name)

	if name == "" || name[0] == '.' {
		return "", errors.New("Invalid name")
	}

	return strings.TrimSpace(name), nil
}
