import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

import { parseTaskInput } from "@/lib/parse-task-input"
import type { Project } from "@/types/domain"

const SCHOOL: Project = {
  id: "p-school",
  name: "School",
  icon: "graduation-cap",
  color: "blue",
  createdAt: 0,
}

const MUSIC: Project = {
  id: "p-music",
  name: "Music",
  icon: "music",
  color: "purple",
  createdAt: 0,
}

const MUSIC_THEORY: Project = {
  id: "p-theory",
  name: "Music Theory",
  icon: "music",
  color: "purple",
  createdAt: 0,
}

const CPP: Project = { id: "p-cpp", name: "C++ Basics", icon: "folder", color: "blue", createdAt: 0 }

const PROJECTS = [SCHOOL, MUSIC, MUSIC_THEORY, CPP]

/**
 * Wednesday, 4 March 2026, 10:00 local time. Parsing is relative to "today", so
 * the clock is frozen to keep the date expectations meaningful.
 */
beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 2, 4, 10, 0, 0))
})

afterAll(() => {
  vi.useRealTimers()
})

describe("parseTaskInput: title", () => {
  it("keeps plain text as the title and reports no match", () => {
    const parsed = parseTaskInput("Finish math homework", PROJECTS)

    expect(parsed.title).toBe("Finish math homework")
    expect(parsed.dueDate).toBeNull()
    expect(parsed.priority).toBe("none")
    expect(parsed.projectId).toBeNull()
    expect(parsed.estimatedPomodoros).toBe(0)
    expect(parsed.matched).toEqual({
      dueDate: false,
      priority: false,
      project: false,
      estimatedPomodoros: false,
    })
  })

  it("removes every recognised token from the title", () => {
    const parsed = parseTaskInput("Practice piano !high #Music tomorrow ~2", PROJECTS)

    expect(parsed.title).toBe("Practice piano")
    expect(parsed.priority).toBe("high")
    expect(parsed.projectId).toBe(MUSIC.id)
    expect(parsed.dueDate).toBe("2026-03-05")
    expect(parsed.estimatedPomodoros).toBe(2)
    expect(parsed.matched).toEqual({
      dueDate: true,
      priority: true,
      project: true,
      estimatedPomodoros: true,
    })
  })

  it("collapses the whitespace the tokens leave behind", () => {
    expect(parseTaskInput("Read   chapter   3", PROJECTS).title).toBe("Read chapter 3")
  })

  it("falls back to the raw text when the input is only tokens", () => {
    expect(parseTaskInput("tomorrow", PROJECTS).title).toBe("tomorrow")
    expect(parseTaskInput("!high", PROJECTS).title).toBe("!high")
  })

  it("never fails on empty input", () => {
    const parsed = parseTaskInput("   ", PROJECTS)

    expect(parsed.title).toBe("")
    expect(parsed.dueDate).toBeNull()
  })
})

describe("parseTaskInput: priority", () => {
  it("recognises the named tokens", () => {
    expect(parseTaskInput("Ship it !high", PROJECTS).priority).toBe("high")
    expect(parseTaskInput("Ship it !medium", PROJECTS).priority).toBe("medium")
    expect(parseTaskInput("Ship it !med", PROJECTS).priority).toBe("medium")
    expect(parseTaskInput("Ship it !low", PROJECTS).priority).toBe("low")
    expect(parseTaskInput("Ship it !none", PROJECTS).priority).toBe("none")
  })

  it("recognises the ! shorthand, longest marker first", () => {
    expect(parseTaskInput("Ship it !!!", PROJECTS).priority).toBe("high")
    expect(parseTaskInput("Ship it !!", PROJECTS).priority).toBe("medium")
    expect(parseTaskInput("Ship it !", PROJECTS).priority).toBe("low")
  })

  it("is case-insensitive", () => {
    expect(parseTaskInput("Ship it !High", PROJECTS).priority).toBe("high")
  })

  it("leaves an exclamation inside a word alone", () => {
    const parsed = parseTaskInput("Wow!great", PROJECTS)

    expect(parsed.priority).toBe("none")
    expect(parsed.title).toBe("Wow!great")
  })
})

describe("parseTaskInput: project", () => {
  it("prefers the longest matching project name", () => {
    const parsed = parseTaskInput("Transcribe #Music Theory", PROJECTS)

    expect(parsed.projectId).toBe(MUSIC_THEORY.id)
    expect(parsed.title).toBe("Transcribe")
    expect(parsed.matched.project).toBe(true)
  })

  it("is case-insensitive", () => {
    expect(parseTaskInput("Essay #school", PROJECTS).projectId).toBe(SCHOOL.id)
  })

  it("escapes regex metacharacters in a project name", () => {
    const parsed = parseTaskInput("Read #C++ Basics", PROJECTS)

    expect(parsed.projectId).toBe(CPP.id)
    expect(parsed.title).toBe("Read")
  })

  it("matches a name that ends in punctuation", () => {
    const odd: Project = { ...CPP, id: "p-odd", name: "Math (2026)" }
    const parsed = parseTaskInput("Revise #Math (2026) tonight", [odd])

    expect(parsed.projectId).toBe("p-odd")
    expect(parsed.title).toBe("Revise")
  })

  it("still refuses a prefix of a longer token", () => {
    // "#Musical" must not claim the "Music" project.
    const parsed = parseTaskInput("Play #Musical", PROJECTS)

    expect(parsed.projectId).toBeNull()
    expect(parsed.title).toBe("Play #Musical")
  })

  it("ignores an unknown #token but keeps it in the title", () => {
    const parsed = parseTaskInput("Essay #Nowhere", PROJECTS)

    expect(parsed.projectId).toBeNull()
    expect(parsed.title).toBe("Essay #Nowhere")
  })

  it("works with no projects at all", () => {
    const parsed = parseTaskInput("Study #School ~3", [])

    expect(parsed.projectId).toBeNull()
    expect(parsed.estimatedPomodoros).toBe(3)
    expect(parsed.title).toBe("Study #School")
  })
})

describe("parseTaskInput: pomodoro estimate", () => {
  it("reads a one- or two-digit count", () => {
    expect(parseTaskInput("Read ~2", PROJECTS).estimatedPomodoros).toBe(2)
    expect(parseTaskInput("Read ~12", PROJECTS).estimatedPomodoros).toBe(12)
  })

  it("reads the spelled-out forms", () => {
    expect(parseTaskInput("Draft the report 3 pomodoros", PROJECTS).estimatedPomodoros).toBe(3)
    expect(parseTaskInput("Draft the report 1 pomodoro", PROJECTS).estimatedPomodoros).toBe(1)
    expect(parseTaskInput("Draft the report 2 pomos", PROJECTS).estimatedPomodoros).toBe(2)
    expect(parseTaskInput("Draft the report 2 pomodoros", PROJECTS).title).toBe("Draft the report")
  })

  it("ignores three digits and a trailing tilde-word", () => {
    expect(parseTaskInput("Read ~123", PROJECTS).estimatedPomodoros).toBe(0)
    expect(parseTaskInput("Read ~tomorrow", PROJECTS).estimatedPomodoros).toBe(0)
  })

  it("prefers the terse ~n form when both appear", () => {
    expect(parseTaskInput("Read ~2 5 pomodoros", PROJECTS).estimatedPomodoros).toBe(2)
  })

  it("does not fire on a number that merely starts a word", () => {
    expect(parseTaskInput("Buy 3 pomodoroish prints", PROJECTS).estimatedPomodoros).toBe(0)
  })
})

describe("parseTaskInput: dates", () => {
  it("recognises the named days", () => {
    expect(parseTaskInput("Finish homework tomorrow", PROJECTS).dueDate).toBe("2026-03-05")
    expect(parseTaskInput("Finish homework today", PROJECTS).dueDate).toBe("2026-03-04")
    expect(parseTaskInput("Finish homework tonight", PROJECTS).dueDate).toBe("2026-03-04")
    expect(parseTaskInput("Finish homework day after tomorrow", PROJECTS).dueDate).toBe("2026-03-06")
  })

  it("accepts a date word in front of them", () => {
    expect(parseTaskInput("Finish homework due today", PROJECTS).dueDate).toBe("2026-03-04")
    expect(parseTaskInput("Finish homework by tomorrow", PROJECTS).dueDate).toBe("2026-03-05")
    expect(parseTaskInput("Finish homework due tomorrow", PROJECTS).title).toBe("Finish homework")
  })

  it("recognises the range phrases", () => {
    expect(parseTaskInput("Trip this weekend", PROJECTS).dueDate).toBe("2026-03-07")
    expect(parseTaskInput("Trip weekend", PROJECTS).dueDate).toBe("2026-03-07")
    expect(parseTaskInput("Trip next week", PROJECTS).dueDate).toBe("2026-03-09")
    expect(parseTaskInput("Trip in 3 days", PROJECTS).dueDate).toBe("2026-03-07")
    expect(parseTaskInput("Trip in 2 weeks", PROJECTS).dueDate).toBe("2026-03-18")
    expect(parseTaskInput("Trip in a week", PROJECTS).dueDate).toBe("2026-03-11")
  })

  it("recognises an explicit calendar date", () => {
    expect(parseTaskInput("Submit by 2026-03-20", PROJECTS).dueDate).toBe("2026-03-20")
    expect(parseTaskInput("Submit 2026-03-20", PROJECTS).title).toBe("Submit")
  })

  it("ignores an impossible calendar date", () => {
    const parsed = parseTaskInput("Submit 2026-13-45", PROJECTS)

    expect(parsed.dueDate).toBeNull()
    expect(parsed.title).toBe("Submit 2026-13-45")
  })

  it("recognises a bare weekday as the coming one", () => {
    expect(parseTaskInput("Standup friday", PROJECTS).dueDate).toBe("2026-03-06")
    expect(parseTaskInput("Standup monday", PROJECTS).dueDate).toBe("2026-03-09")
  })

  it("reads next <weekday> as the weekday of next week", () => {
    // Today is Wednesday 4 March, so next week runs Monday 9 to Sunday 15.
    expect(parseTaskInput("Essay next friday", PROJECTS).dueDate).toBe("2026-03-13")
    expect(parseTaskInput("Essay next monday", PROJECTS).dueDate).toBe("2026-03-09")
    expect(parseTaskInput("Essay next wednesday", PROJECTS).dueDate).toBe("2026-03-11")
    expect(parseTaskInput("Essay next sunday", PROJECTS).dueDate).toBe("2026-03-15")
  })

  it("recognises an introduced abbreviation", () => {
    expect(parseTaskInput("Standup on mon", PROJECTS).dueDate).toBe("2026-03-09")
    expect(parseTaskInput("Standup by fri", PROJECTS).dueDate).toBe("2026-03-06")
    expect(parseTaskInput("Standup due tues", PROJECTS).dueDate).toBe("2026-03-10")
  })

  it("does not treat ordinary words as dates", () => {
    // "sat" only counts as Saturday when a date word introduces it.
    const parsed = parseTaskInput("I sat down and read", PROJECTS)

    expect(parsed.dueDate).toBeNull()
    expect(parsed.title).toBe("I sat down and read")
  })

  it("removes the date phrase from the title", () => {
    const parsed = parseTaskInput("Finish homework tomorrow", PROJECTS)

    expect(parsed.title).toBe("Finish homework")
    expect(parsed.matched.dueDate).toBe(true)
  })
})
