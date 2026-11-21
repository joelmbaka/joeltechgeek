import { Image } from 'react-native';

/** Offline WhatsApp brand glyph; no icon-font or network dependency. */
const SOURCE = { uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwBAMAAAClLOS0AAAAJFBMVEUAAAAj1GXz/PYU52xi35GQ6LEm2moRsWQl2WkA/wCw78gA///hPvqVAAAADHRSTlMA/P8R/v6fA2EB/gEs5PNlAAACeklEQVR42rWTQUgUYRTHfzPf7o7Dou2o1EKUCx5SYmG2JayLKHbNJAKrk9E5Gijw0GVAkKAOAx5COoZ1bDWIiIJu1qGatMjo4JaSu2btiqmz7s5Oh9nRzbxF3+WD//9733vv/38P/uWMj++NGyCu/Q3fgHTaQOzGT3LikqbtH0GpAZJ/KaXRWwAMNmDVEeqRyGdEKrZio6w+GNgh7l5RSWUBscKZey6ADKBWLtCbPVYotLutPE5mAL+K2wv3JefgNHzbvDm90Te1EHylpx41tdkAiKa2D8tBDkVSV9uKQZnNP64WLT/HVCeJX1qLT3hVxtprOVq1L5GNBq8jB0ApVnnogQzqWKYjCQz5IbIoJ3UIQTVMtiBBxifcKnrMRoJoOdq6IsUo1NKnvJkfIMPE0VCZhh097RgCBMRTb0NORcUJCi5W10AGC8cEE71GCFBAgKG+crKUcoVSLULZWveQgSxA0dcTwAvUTQDMQqzeUhksGICKHrgpSYRABgNM4AW0gOgjjFwCGXoyAsAzqfaI7je6Y5b9PiavP2/cAJ4prKZtjLydXwcZNoclF6CSwLGBrH1a92X3lM54DviuAKzlNx1yhIBkanIfgLvWCPS/Ds+6fh+q7fmVVjpMMBNuMCVLP8OdjgOw+KTjXfN8v5fzI1xnYEaqSWgnDoU/DgUDl7HdxKJP9Mq2+94IBm5OKua6Su15hJVZ5nBLLiDOa3PMH/+kqsrLA7mzT5e2lbyjaZqmnbo4cU7T4jXDJEDQtP1GiavTgY9ERBgGt7rnYLA4+7XOlIimXQaRTusoVr1bKW2Eri4LGP4DN0ZNdFAzUWvXyuqoe69+1OB/nt9cqcqX+84SAwAAAABJRU5ErkJggg==' };

export function WhatsAppIcon({ size = 22 }: { size?: number }) {
  return <Image source={SOURCE} style={{width:size,height:size}} resizeMode="contain"
    accessibilityElementsHidden importantForAccessibility="no"/>;
}
