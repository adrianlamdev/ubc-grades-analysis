"use client";

import React, { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Check,
  ChevronsUpDown,
  AlertTriangle,
  ChevronRight,
  Info,
  Loader,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

const fetcher = (url) => fetch(url).then((res) => res.json());

const PREDICTION_RANGE = {
  start: new Date().getFullYear(),
  years_ahead: 2,
};

const years = Array.from({ length: PREDICTION_RANGE.years_ahead + 1 }, (_, i) =>
  (PREDICTION_RANGE.start + i).toString(),
);

const formSchema = z.object({
  subject: z
    .string({
      required_error: "Please select a subject",
    })
    .min(1, "Please select a subject"),
  course: z
    .string({
      required_error: "Please select a course",
    })
    .min(1, "Please select a course"),
  year: z
    .string({
      required_error: "Please select a year",
    })
    .min(1, "Please select a year"),
});

export default function GradePredictor() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [openSubject, setOpenSubject] = useState(false);
  const [openCourse, setOpenCourse] = useState(false);

  const { data: subjects, error: subjectsError } = useSWR(
    "/api/v1/subjects",
    fetcher,
  );

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      course: "",
      year: "",
    },
  });

  const selectedSubject = form.watch("subject");
  const { data: courses, error: coursesError } = useSWR(
    selectedSubject
      ? `/api/v1/subjects/courses?subject=${selectedSubject}`
      : null,
    fetcher,
  );

  const onSubmit = async (values) => {
    setError("");
    setPrediction(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Failed to get prediction");

      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      setError("Failed to get prediction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (subjectsError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load subjects. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="min-h-screen p-4 mt-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Grade Predictor</CardTitle>
            <CardDescription>
              Enter your course details to get a predicted grade based on
              historical data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Subject</FormLabel>
                      <Popover open={openSubject} onOpenChange={setOpenSubject}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openSubject}
                              className="w-full justify-between"
                            >
                              {field.value
                                ? subjects?.find(
                                    (subject) =>
                                      subject.subject_code === field.value,
                                  )?.subject_code
                                : "Select subject..."}
                              <ChevronsUpDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[--radix-popover-trigger-width] min-w-[var(--radix-popover-trigger-width)]">
                          <Command className="max-h-[300px]">
                            <CommandInput placeholder="Search subjects..." />
                            <CommandEmpty>No subject found.</CommandEmpty>
                            <CommandGroup className="overflow-auto">
                              {subjects?.map((subject) => (
                                <CommandItem
                                  key={subject.id}
                                  value={subject.subject_code}
                                  onSelect={(value) => {
                                    form.setValue("subject", value);
                                    form.setValue("course", "");
                                    setOpenSubject(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === subject.subject_code
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {subject.subject_code}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Choose the main subject area
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="course"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Course</FormLabel>
                      <Popover open={openCourse} onOpenChange={setOpenCourse}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openCourse}
                              className="w-full justify-between"
                              disabled={!selectedSubject || !courses}
                            >
                              {field.value
                                ? courses?.find(
                                    (course) =>
                                      course.course_number === field.value,
                                  )?.course_number
                                : !selectedSubject
                                  ? "Select a subject first"
                                  : !courses
                                    ? "Loading courses..."
                                    : "Select course..."}
                              <ChevronsUpDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[--radix-popover-trigger-width] min-w-[var(--radix-popover-trigger-width)]">
                          <Command className="max-h-[300px]">
                            <CommandInput placeholder="Search courses..." />
                            <CommandEmpty>No course found.</CommandEmpty>
                            <CommandGroup className="overflow-auto">
                              {courses?.map((course) => (
                                <CommandItem
                                  key={course.id}
                                  value={course.course_number}
                                  onSelect={(value) => {
                                    form.setValue("course", value);
                                    setOpenCourse(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === course.course_number
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {course.course_number}
                                  {course.title ? ` - ${course.title}` : ""}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Select the specific course
                      </FormDescription>
                      <FormMessage />
                      {coursesError && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertDescription>
                            Failed to load courses. Please try again.
                          </AlertDescription>
                        </Alert>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prediction Year</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select year to predict" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the year you want to predict
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Card className="border-amber-600/30 bg-amber-600/40 shadow">
                  <CardHeader>
                    <div className="flex items-start gap-2">
                      <div>
                        <CardTitle className="text-amber-500 text-sm font-medium flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                          Important Disclaimer
                        </CardTitle>
                        <CardDescription className="mt-1.5 text-foreground">
                          Results should be taken as rough estimates only and
                          may not accurately reflect future performance.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isLoading ||
                    !form.formState.isValid ||
                    !form.getValues("subject") ||
                    !form.getValues("course") ||
                    !form.getValues("year")
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      <span>Predicting...</span>
                    </>
                  ) : (
                    "Predict Grade"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          {prediction && (
            <CardFooter className="flex flex-col space-y-4">
              <div className="w-full p-4 bg-primary/10 rounded-lg">
                <h3 className="font-semibold text-primary">
                  Prediction Results
                </h3>
                <div className="mt-2 space-y-2">
                  <p>
                    Predicted GPA:{" "}
                    <span className="font-bold">
                      {prediction.predictedGrade}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Confidence: {prediction.confidence}%
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                asChild
              >
                <Link href="/how-we-predict-grades">
                  <Info className="w-4 h-4" />
                  <span>Learn how we calculate this</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
