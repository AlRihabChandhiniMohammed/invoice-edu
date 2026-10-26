"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CircleAlert,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
  TableWrap,
  Td,
  Th,
} from "@/components/ui";
import { deleteCourse, saveCourse } from "@/lib/actions";
import { formatMoney } from "@/lib/format";
import type { Course, CourseLevel } from "@/lib/types";

const LEVELS: CourseLevel[] = ["Beginner", "Intermediate", "Advanced"];

type Draft = {
  id?: string;
  title: string;
  category: string;
  level: CourseLevel;
  actualPrice: string;
  discountedPrice: string;
  active: boolean;
};

const EMPTY_DRAFT: Draft = {
  title: "",
  category: "",
  level: "Beginner",
  actualPrice: "",
  discountedPrice: "",
  active: true,
};

export function CoursesManager({
  courses,
  currency,
}: {
  courses: Course[];
  currency: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [deleteArmed, setDeleteArmed] = useState(false);

  const categories = useMemo(
    () => [...new Set(courses.map((course) => course.category))].sort(),
    [courses],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return courses;
    return courses.filter((course) =>
      `${course.title} ${course.category} ${course.level}`.toLowerCase().includes(term),
    );
  }, [courses, query]);

  useEffect(() => {
    if (!draft) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDraft(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [draft]);

  function openNew() {
    setError("");
    setDeleteArmed(false);
    setDraft({ ...EMPTY_DRAFT, category: categories[0] ?? "" });
  }

  function openEdit(course: Course) {
    setError("");
    setDeleteArmed(false);
    setDraft({
      id: course.id,
      title: course.title,
      category: course.category,
      level: course.level,
      actualPrice: String(course.actualPrice),
      discountedPrice: String(course.discountedPrice),
      active: course.active,
    });
  }

  function openDelete(course: Course) {
    setError("");
    setDeleteArmed(true);
    setDraft({
      id: course.id,
      title: course.title,
      category: course.category,
      level: course.level,
      actualPrice: String(course.actualPrice),
      discountedPrice: String(course.discountedPrice),
      active: course.active,
    });
  }

  const actual = draft ? Number(draft.actualPrice) || 0 : 0;
  const discounted = draft ? Number(draft.discountedPrice) || 0 : 0;
  const off = actual > 0 ? Math.round(((actual - discounted) / actual) * 100) : 0;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    const title = draft.title.trim();
    if (!title) {
      setError("Course title is required.");
      return;
    }
    if (!(Number(draft.actualPrice) > 0)) {
      setError("Actual price must be greater than zero.");
      return;
    }
    if (!(Number(draft.discountedPrice) >= 0) || Number(draft.discountedPrice) > Number(draft.actualPrice)) {
      setError("Discounted price must be between 0 and the actual price.");
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await saveCourse({
        id: draft.id,
        title,
        category: draft.category.trim() || "General",
        level: draft.level,
        actualPrice: Number(draft.actualPrice),
        discountedPrice: Number(draft.discountedPrice),
        active: draft.active,
      });
      if (result.ok) {
        setDraft(null);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function removeCourse(course: Course) {
    startTransition(async () => {
      await deleteCourse(course.id);
      setDraft(null);
      setDeleteArmed(false);
      router.refresh();
    });
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search courses..."
            className="pl-10"
            aria-label="Search courses"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-500">
            {filtered.length} of {courses.length}
          </span>
          <Button size="sm" onClick={openNew}>
            <Plus className="size-4" />
            Add course
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="size-5" />}
          title="No courses found"
          description="Add a course with its actual and discounted fee to use it on invoices."
          action={
            <Button size="sm" onClick={openNew}>
              Add course
            </Button>
          }
        />
      ) : (
        <TableWrap>
          <table className="w-full">
            <thead className="border-b border-slate-100 bg-slate-50/60">
              <tr>
                <Th>Course</Th>
                <Th>Category</Th>
                <Th>Level</Th>
                <Th className="text-right">Actual</Th>
                <Th className="text-right">Final</Th>
                <Th className="text-right">Discount</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((course) => {
                const pct =
                  course.actualPrice > 0
                    ? Math.round(
                        ((course.actualPrice - course.discountedPrice) / course.actualPrice) * 100,
                      )
                    : 0;
                return (
                  <tr key={course.id} className="group hover:bg-slate-50/70">
                    <Td>
                      <p className="font-medium text-ink-700">{course.title}</p>
                    </Td>
                    <Td className="text-slate-500">{course.category}</Td>
                    <Td className="text-slate-500">{course.level}</Td>
                    <Td className="text-right text-slate-500">
                      {formatMoney(course.actualPrice, currency)}
                    </Td>
                    <Td className="text-right font-semibold text-ink-700">
                      {formatMoney(course.discountedPrice, currency)}
                    </Td>
                    <Td className="text-right">
                      {pct > 0 ? (
                        <Badge tone="success">{pct}% off</Badge>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </Td>
                    <Td>
                      {course.active ? (
                        <Badge tone="success">Active</Badge>
                      ) : (
                        <Badge tone="neutral">Inactive</Badge>
                      )}
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(course)}
                          aria-label={`Edit ${course.title}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink-700"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDelete(course)}
                          aria-label={`Delete ${course.title}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      )}

      {draft && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
            onClick={() => setDraft(null)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-[20px] bg-white shadow-elev3">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-display text-base font-bold text-ink-700">
                  {draft.id ? "Edit course" : "Add course"}
                </h2>
                <p className="text-xs text-slate-500">
                  Set the actual fee and the final discounted fee students pay.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setDraft(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink-700"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4 px-5 py-4">
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
                  {error}
                </div>
              )}

              <Field label="Course title" htmlFor="courseTitle" required>
                <Input
                  id="courseTitle"
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  placeholder="e.g. Python for Kids"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category" htmlFor="courseCategory">
                  <Input
                    id="courseCategory"
                    list="course-categories"
                    value={draft.category}
                    onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                    placeholder="e.g. Foundations"
                  />
                  <datalist id="course-categories">
                    {categories.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </Field>
                <Field label="Level" htmlFor="courseLevel">
                  <Select
                    id="courseLevel"
                    value={draft.level}
                    onChange={(event) =>
                      setDraft({ ...draft, level: event.target.value as CourseLevel })
                    }
                  >
                    {LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={`Actual fee (${currency})`} htmlFor="actualFee" required>
                  <Input
                    id="actualFee"
                    type="number"
                    min="1"
                    step="0.01"
                    value={draft.actualPrice}
                    onChange={(event) => setDraft({ ...draft, actualPrice: event.target.value })}
                  />
                </Field>
                <Field label={`Final discounted fee (${currency})`} htmlFor="finalFee" required>
                  <Input
                    id="finalFee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.discountedPrice}
                    onChange={(event) =>
                      setDraft({ ...draft, discountedPrice: event.target.value })
                    }
                  />
                </Field>
              </div>

              {actual > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-2.5 text-xs text-brand-800">
                  <span>Student saves {formatMoney(Math.max(0, actual - discounted), currency)}</span>
                  <span className="font-semibold">{off}% off</span>
                </div>
              )}

              <label className="flex items-center gap-2.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
                  className="size-4 rounded border-slate-300 accent-brand-600"
                />
                Available for new invoices
              </label>

              <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                {draft.id ? (
                  deleteArmed ? (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          const course = courses.find((c) => c.id === draft.id);
                          if (course) removeCourse(course);
                        }}
                      >
                        {pending ? "Deleting..." : "Confirm delete"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteArmed(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => setDeleteArmed(true)}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  )
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setDraft(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={pending}>
                    {pending ? "Saving..." : draft.id ? "Save changes" : "Add course"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}
