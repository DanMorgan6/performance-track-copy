import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function OutcomeMeasureForm({ outcomeMeasure, onSubmit, onCancel }) {
  const [responses, setResponses] = useState([]);

  const handleAnswerChange = (questionIndex, option) => {
    const newResponses = [...responses];
    newResponses[questionIndex] = {
      question_index: questionIndex,
      answer: option.label,
      score: option.score
    };
    setResponses(newResponses);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalScore = responses.reduce((sum, r) => sum + (r?.score || 0), 0);
    onSubmit({
      responses,
      total_score: totalScore,
      completed_date: new Date().toISOString().split('T')[0],
      status: 'completed'
    });
  };

  const isComplete = responses.filter(r => r).length === outcomeMeasure.questions.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">{outcomeMeasure.name}</h3>
        <p className="text-sm text-slate-500">{outcomeMeasure.description}</p>
      </div>

      <div className="space-y-6">
        {outcomeMeasure.questions.map((question, index) => (
          <div key={index} className="p-4 bg-slate-50 rounded-xl">
            <Label className="text-sm font-medium text-slate-700 mb-3 block">
              {index + 1}. {question.question}
            </Label>
            <div className="space-y-2">
              {question.options.map((option, optIndex) => (
                <label
                  key={optIndex}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                    responses[index]?.answer === option.label
                      ? "border-purple-500 bg-purple-50"
                      : "border-slate-200 hover:border-purple-200 bg-white"
                  )}
                >
                  <input
                    type="radio"
                    name={`question-${index}`}
                    checked={responses[index]?.answer === option.label}
                    onChange={() => handleAnswerChange(index, option)}
                    className="text-purple-600"
                  />
                  <span className="text-sm text-slate-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!isComplete}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
        >
          Submit Responses
        </Button>
      </div>
    </form>
  );
}