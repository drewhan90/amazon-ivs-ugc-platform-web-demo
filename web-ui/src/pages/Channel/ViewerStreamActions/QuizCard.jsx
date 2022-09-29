import { m } from 'framer-motion';
import { useCallback, useState, useLayoutEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import {
  correctAnswerClasses,
  defaultViewerStreamActionAnimationProps,
  incorrectAnswerClasses
} from './viewerStreamActionsTheme';
import { clsm } from '../../../utils';
import { STREAM_ACTION_NAME } from '../../../constants';
import Button from '../../../components/Button';
import ProgressBar from './ProgressBar';

const defaultQuizAnswerHeight = 42;

const QuizCard = ({
  answers,
  color,
  correctAnswerIndex,
  duration,
  question,
  startTime,
  isControlsOpen,
  setCurrentViewerAction,
  shouldRenderActionInTab
}) => {
  const [answerHeight, setAnswerHeight] = useState(defaultQuizAnswerHeight);
  const [isAnswerSelected, setIsAnswerSelected] = useState();
  const [chosenAnswer, setChosenAnswer] = useState('');
  const correctAnswer = answers[correctAnswerIndex];
  const quizButtonArrRef = useRef([]);

  const profileColorButtonClassNames = clsm([
    color
      ? [
          `bg-profile-${color}-light`,
          `hover:bg-profile-${color}-light-hover`,
          `focus:bg-profile-${color}-light`
        ]
      : [
          'bg-profile-default-light',
          'hover:bg-profile-default-light-hover',
          'focus:bg-profile-default-light'
        ],
    color && ['green', 'blue'].includes(color)
      ? ['focus:shadow-white', 'text-white', 'disabled:text-white']
      : ['focus:shadow-black', 'text-black', 'disabled:text-black']
  ]);

  const quizContainerClasses = !shouldRenderActionInTab
    ? ['max-w-[640px]', 'min-w-[482px]', 'h-screen', 'justify-end']
    : '';

  const selectAnswer = (answer) => {
    setIsAnswerSelected(true);
    setChosenAnswer(answer);
    setTimeout(() => setCurrentViewerAction(null), 2000);
  };

  const onCompletionHandler = useCallback(() => {
    setCurrentViewerAction((prev) => {
      if (prev?.name === STREAM_ACTION_NAME.QUIZ) return null;

      // Don't cancel the current action if it changed to something other than a quiz
      return prev;
    });
  }, [setCurrentViewerAction]);

  useLayoutEffect(() => {
    quizButtonArrRef.current.forEach((quizButton) => {
      if (quizButton.clientHeight > answerHeight) {
        setAnswerHeight(quizButton.clientHeight);
      }
    });
  }, [answerHeight]);

  return (
    <div
      className={clsm([
        quizContainerClasses,
        'absolute',
        'flex-col',
        'flex',
        'h-full',
        'no-scrollbar',
        'overflow-x-hidden',
        'overflow-y-auto',
        'p-5',
        'supports-overlay:overflow-y-overlay',
        'transition-[margin]',
        'w-full',
        'z-10',
        isControlsOpen && !shouldRenderActionInTab && 'mb-20'
      ])}
    >
      <m.div
        {...(!shouldRenderActionInTab
          ? defaultViewerStreamActionAnimationProps
          : {})}
        variants={{
          visible: { y: 0, opacity: 1, scale: 1 },
          hidden: { y: '100%', opacity: 0, scale: 0.5 }
        }}
        className={clsm([
          `bg-profile-${color ? color : 'default'}`,
          'flex-col',
          'flex',
          'items-start',
          'rounded-3xl',
          'w-full'
        ])}
      >
        <h3
          className={clsm([
            'flex',
            'p-5',
            'w-full',
            'justify-center',
            'break-word',
            `${
              color && ['green', 'blue'].includes(color)
                ? 'text-white'
                : 'text-black'
            }`
          ])}
        >
          {question}
        </h3>
        <div
          className={clsm(['flex-col', 'flex', 'gap-y-2.5', 'px-5', 'w-full'])}
        >
          {answers.map((answer, index) => (
            <Button
              key={`answer-${index}`}
              ariaLabel={`answer ${index + 1}`}
              customStyles={{ minHeight: `${answerHeight}px` }}
              className={clsm([
                profileColorButtonClassNames,
                'whitespace-normal',
                'h-auto',
                isAnswerSelected === true && chosenAnswer === answer
                  ? answer === correctAnswer
                    ? correctAnswerClasses
                    : incorrectAnswerClasses
                  : ''
              ])}
              onClick={() => selectAnswer(answer)}
              isDisabled={isAnswerSelected === true && chosenAnswer !== answer}
              ref={(el) => (quizButtonArrRef.current[index] = el)}
            >
              {answer}
            </Button>
          ))}
          <div className={clsm(['pt-2.5', 'pb-5'])}>
            <ProgressBar
              color={color}
              duration={duration}
              startTime={startTime}
              onCompletion={onCompletionHandler}
            />
          </div>
        </div>
      </m.div>
    </div>
  );
};

QuizCard.defaultProps = {
  answers: [],
  color: '',
  correctAnswerIndex: 0,
  duration: 10,
  isControlsOpen: false,
  shouldRenderActionInTab: false
};

QuizCard.propTypes = {
  answers: PropTypes.arrayOf(PropTypes.string),
  color: PropTypes.string,
  correctAnswerIndex: PropTypes.number,
  duration: PropTypes.number,
  isControlsOpen: PropTypes.bool,
  question: PropTypes.string.isRequired,
  setCurrentViewerAction: PropTypes.func.isRequired,
  shouldRenderActionInTab: PropTypes.bool,
  startTime: PropTypes.number.isRequired
};

export default QuizCard;