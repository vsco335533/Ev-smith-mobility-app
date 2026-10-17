import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { RotateCcw, Check } from 'lucide-react-native';
import { colors, borderRadius, spacing } from '../../theme';
import { EVButton } from '../common/EVButton';

interface Point {
  x: number;
  y: number;
}

interface SignaturePadProps {
  onSave: (signatureData: string) => void;
  height?: number;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  height = 200,
}) => {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [isSigned, setIsSigned] = useState<boolean>(false);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (evt: GestureResponderEvent) => {
      const { locationX, locationY } = evt.nativeEvent;
      const newPath = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
      setCurrentPath(newPath);
    },

    onPanResponderMove: (evt: GestureResponderEvent) => {
      const { locationX, locationY } = evt.nativeEvent;
      setCurrentPath((prev) => `${prev} L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`);
      setIsSigned(true);
    },

    onPanResponderRelease: () => {
      if (currentPath) {
        setPaths((prev) => [...prev, currentPath]);
        setCurrentPath('');
      }
    },
  });

  const handleClear = () => {
    setPaths([]);
    setCurrentPath('');
    setIsSigned(false);
  };

  const handleConfirm = () => {
    if (!isSigned && paths.length === 0) return;
    // Combine all paths into a single SVG data string
    const allPaths = [...paths, currentPath].filter(Boolean).join(' ');
    const svgData = `<svg height="${height}" width="350" xmlns="http://www.w3.org/2000/svg"><path d="${allPaths}" stroke="#00E599" stroke-width="3" fill="none"/></svg>`;
    onSave(svgData);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Digital Signature Pad</Text>
        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearBtn}
          activeOpacity={0.7}
        >
          <RotateCcw size={14} color={colors.textSecondary} />
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View
        style={[styles.pad, { height }]}
        {...panResponder.panHandlers}
      >
        <Svg height={height} width="100%" style={StyleSheet.absoluteFill}>
          {paths.map((d, index) => (
            <Path
              key={`path-${index}`}
              d={d}
              stroke={colors.primary}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          {currentPath ? (
            <Path
              d={currentPath}
              stroke={colors.primary}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ) : null}
        </Svg>

        {!isSigned && paths.length === 0 ? (
          <View style={styles.watermark} pointerEvents="none">
            <Text style={styles.watermarkText}>
              Sign with your finger inside this box
            </Text>
          </View>
        ) : null}
      </View>

      <EVButton
        title="Confirm Signature"
        onPress={handleConfirm}
        variant="primary"
        size="sm"
        disabled={!isSigned && paths.length === 0}
        style={styles.confirmBtn}
        icon={<Check size={16} color="#080C0E" strokeWidth={3} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  clearText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  pad: {
    backgroundColor: '#0A1014',
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.surfaceBorder,
    overflow: 'hidden',
    position: 'relative',
  },
  watermark: {
    ...(StyleSheet.absoluteFill as object),
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermarkText: {
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  confirmBtn: {
    marginTop: spacing.sm,
  },
});
